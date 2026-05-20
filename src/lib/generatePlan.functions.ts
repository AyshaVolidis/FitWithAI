import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({ energyLevel: z.number().min(1).max(5) });

type Segment = { phase: "warmup" | "main" | "cooldown"; video_id: string; title: string; channel: string; thumbnail: string; duration_seconds: number };

type YTItem = { id: { videoId: string }; snippet: { title: string; channelTitle: string; thumbnails: { medium?: { url: string }; default?: { url: string } } } };

class YouTubeUnavailableError extends Error {}

async function ytSearch(query: string, max = 3): Promise<YTItem[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new YouTubeUnavailableError("missing key");
  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoEmbeddable: "true",
    videoSyndicated: "true",
    safeSearch: "strict",
    maxResults: String(max),
    q: query,
    key,
  });
  const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error("YouTube API error", r.status, body);
    throw new YouTubeUnavailableError(`YouTube ${r.status}`);
  }
  const j = await r.json() as { items?: YTItem[] };
  return j.items ?? [];
}

type SeedVideo = { youtube_id: string; title: string; thumbnail_url: string | null; duration_seconds: number };

function seedToSegment(v: SeedVideo, phase: Segment["phase"], duration_seconds: number): Segment {
  return {
    phase,
    video_id: v.youtube_id,
    title: v.title,
    channel: "",
    thumbnail: v.thumbnail_url ?? `https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`,
    duration_seconds,
  };
}

function segFromYT(it: YTItem, phase: Segment["phase"], duration_seconds: number): Segment {
  return {
    phase,
    video_id: it.id.videoId,
    title: it.snippet.title,
    channel: it.snippet.channelTitle,
    thumbnail: it.snippet.thumbnails?.medium?.url ?? it.snippet.thumbnails?.default?.url ?? "",
    duration_seconds,
  };
}

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: profile, error: pErr } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (pErr || !profile) throw new Error("Profile not found");

    // Today's existing pending/in-progress session — return it
    const today = new Date().toISOString().slice(0, 10);
    const { data: existing } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .in("status", ["pending", "in_progress"])
      .maybeSingle();
    if (existing) return { sessionId: existing.id, plan: existing.plan_json };

    const goal = profile.goal ?? "general_fitness";
    const level = profile.fitness_level ?? "beginner";
    const equipment = profile.equipment ?? ["none"];

    // Build search queries based on profile + energy
    const energy = data.energyLevel;
    const intensityWord = energy <= 2 ? "low impact" : energy >= 4 ? "intense" : "";
    const goalWord = ({
      lose_weight: "fat burn cardio",
      build_muscle: "strength training",
      improve_endurance: "endurance cardio",
      general_fitness: "full body",
      flexibility: "mobility",
    } as Record<string, string>)[goal] ?? "full body";
    const equipWord = equipment.includes("none") || !equipment.length
      ? "no equipment"
      : equipment.includes("dumbbells") ? "dumbbell" : "home gym";

    const targetMin = profile.duration_preference ?? 30;
    const adjustedMin = Math.max(15, Math.round(targetMin * (0.6 + energy * 0.1)));
    const mainMin = Math.max(8, adjustedMin - 10);

    const pickRandom = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

    async function fetchSeed(phase: "warmup" | "main" | "cooldown"): Promise<SeedVideo[]> {
      const { data } = await supabase
        .from("seed_videos")
        .select("youtube_id, title, thumbnail_url, duration_seconds")
        .eq("phase", phase)
        .limit(20);
      return data ?? [];
    }

    let segments: Segment[];
    try {
      const [warmupRes, mainRes, cooldownRes] = await Promise.all([
        ytSearch(`5 minute warm up ${level}`, 3),
        ytSearch(`${mainMin} minute ${intensityWord} ${equipWord} ${goalWord} ${level}`.replace(/\s+/g, " ").trim(), 5),
        ytSearch(`5 minute cool down stretch`, 3),
      ]);
      if (!warmupRes.length || !mainRes.length || !cooldownRes.length) {
        throw new YouTubeUnavailableError("empty results");
      }
      segments = [
        segFromYT(pickRandom(warmupRes), "warmup", 5 * 60),
        segFromYT(pickRandom(mainRes), "main", mainMin * 60),
        segFromYT(pickRandom(cooldownRes), "cooldown", 5 * 60),
      ];
    } catch (err) {
      if (!(err instanceof YouTubeUnavailableError)) throw err;
      console.warn("[generatePlan] YouTube unavailable, using seed_videos fallback");
      const [warm, main, cool] = await Promise.all([fetchSeed("warmup"), fetchSeed("main"), fetchSeed("cooldown")]);
      if (!warm.length || !main.length || !cool.length) {
        throw new Error("Workout video library is empty. Please add seed videos or configure a working YouTube API key.");
      }
      segments = [
        seedToSegment(pickRandom(warm), "warmup", 5 * 60),
        seedToSegment(pickRandom(main), "main", mainMin * 60),
        seedToSegment(pickRandom(cool), "cooldown", 5 * 60),
      ];
    }

    const plan = {
      generated_at: new Date().toISOString(),
      energy_level: energy,
      total_duration_seconds: segments.reduce((s, x) => s + x.duration_seconds, 0),
      segments,
    };

    const { data: session, error: sErr } = await supabase
      .from("workout_sessions")
      .insert({ user_id: userId, date: today, energy_level: energy, plan_json: plan, status: "pending" })
      .select()
      .single();
    if (sErr) throw new Error(sErr.message);

    return { sessionId: session.id, plan };
  });
