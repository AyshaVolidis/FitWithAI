import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, SkipForward, Check, X, Pause, Play } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/player")({
  validateSearch: z.object({ id: z.string() }),
  head: () => ({ meta: [{ title: "Workout — FitAI" }] }),
  component: Player,
});

type Segment = { phase: string; video_id: string; title: string; duration_seconds: number };

const VIDEO_REPLACEMENTS: Record<string, Pick<Segment, "video_id" | "title">> = {
  OCrUbhLPHHs: { video_id: "oAPCPjnU1wA", title: "Quick 5 Minute Warm Up" },
  Ohbu5PxVNVc: { video_id: "inpok4MKVLM", title: "5 Min Calm Cool Down Stretch" },
  SQE0r3rg40k: { video_id: "L_xrDAtykMI", title: "Full Body Dynamic Warm Up" },
  jdkv1S_7Krg: { video_id: "R0mMyV5OtcM", title: "5 Min Full Body Warm Up" },
  jpicy3wTWJg: { video_id: "ml6cT4AZdqI", title: "20 Min HIIT Workout" },
  MX_Sf48xlbg: { video_id: "ZSt9tm3RoUU", title: "Low Impact Cardio" },
  S1eY1ofb3ZY: { video_id: "UBMk30rjy0o", title: "Beginner Bodyweight Strength" },
  "ZQbEAzU3D-A": { video_id: "4pKly2JojMw", title: "Post Workout Stretch Routine" },
  eml0X_1uLZo: { video_id: "sTANio_2E0Q", title: "Yoga Cool Down" },
};

function playableSegment(segment: Segment): Segment {
  const replacement = VIDEO_REPLACEMENTS[segment.video_id];
  return replacement ? { ...segment, ...replacement } : segment;
}

function Player() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [idx, setIdx] = useState(0);
  const [startedAt] = useState(Date.now());
  const [segStart, setSegStart] = useState(Date.now());
  const [restSeconds, setRestSeconds] = useState<number | null>(null);
  const restRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("workout_sessions").select("plan_json").eq("id", id).single();
      if (data) {
        const plan = data.plan_json as { segments: Segment[] };
        setSegments(plan.segments.map(playableSegment));
        await supabase.from("workout_sessions").update({ status: "in_progress" }).eq("id", id);
      }
    })();
  }, [id]);

  // Rest countdown
  useEffect(() => {
    if (restSeconds == null) return;
    if (restSeconds <= 0) { setRestSeconds(null); return; }
    restRef.current = setTimeout(() => setRestSeconds((s) => (s == null ? null : s - 1)), 1000);
    return () => { if (restRef.current) clearTimeout(restRef.current); };
  }, [restSeconds]);

  const recordFeedback = async (skipped: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("segment_feedback").insert({
      session_id: id,
      user_id: user.id,
      segment_index: idx,
      video_id: segments[idx].video_id,
      skipped,
      watch_duration_seconds: Math.round((Date.now() - segStart) / 1000),
    });
  };

  const next = async (skipped: boolean) => {
    await recordFeedback(skipped);
    if (idx + 1 >= segments.length) {
      const totalSeconds = Math.round((Date.now() - startedAt) / 1000);
      await supabase.from("workout_sessions").update({
        status: "completed",
        duration_actual: totalSeconds,
        completed_at: new Date().toISOString(),
      }).eq("id", id);
      navigate({ to: "/complete", search: { id } });
      return;
    }
    setIdx((i) => i + 1);
    setSegStart(Date.now());
    // Start a 30s rest between segments
    setRestSeconds(30);
  };

  if (!segments.length) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;

  const seg = playableSegment(segments[idx]);
  const progress = ((idx + 1) / segments.length) * 100;

  return (
    <div className="min-h-screen bg-background">
       <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-white/10 bg-background/80 px-4 py-3 backdrop-blur-xl">
         <button onClick={() => navigate({ to: "/dashboard" })} className="rounded-md p-2 hover:bg-white/10 transition-all">
           <ChevronLeft className="h-5 w-5" />
         </button>
         <div className="flex-1">
           <div className="text-xs uppercase tracking-wider text-primary glow-cyan">{seg.phase} · {idx + 1}/{segments.length}</div>
           <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
             <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-gradient-neon glow-neon" />
           </div>
         </div>
         <div className="w-9" />
       </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {restSeconds != null ? (
          <RestTimer seconds={restSeconds} onSkip={() => setRestSeconds(null)} />
        ) : (
          <>
             <div className="aspect-video overflow-hidden rounded-2xl border border-white/20 bg-black glow-neon">
               <iframe
                key={seg.video_id}
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${seg.video_id}?autoplay=1&rel=0&playsinline=1`}
                title={seg.title}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold">{seg.title}</h1>
                <div className="text-sm text-muted-foreground">~{Math.round(seg.duration_seconds / 60)} min</div>
              </div>
               <a
                 href={`https://www.youtube.com/watch?v=${seg.video_id}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="shrink-0 rounded-md border border-white/20 px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all"
               >
                 Open on YouTube
               </a>
            </div>

             <div className="mt-8 grid grid-cols-2 gap-3">
               <Button onClick={() => next(true)} variant="outline" size="lg" className="border-white/20 hover:bg-white/10 transition-all">
                 <SkipForward className="mr-2 h-4 w-4" /> Skip
               </Button>
               <Button onClick={() => next(false)} size="lg" className="bg-gradient-neon text-primary-foreground hover:opacity-90 transition-all hover-lift">
                 <Check className="mr-2 h-4 w-4" /> Done
               </Button>
             </div>
             <button onClick={() => navigate({ to: "/dashboard" })} className="mx-auto mt-6 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all">
               <X className="h-3 w-3" /> End session
             </button>
          </>
        )}
      </main>
    </div>
  );
}

function RestTimer({ seconds, onSkip }: { seconds: number; onSkip: () => void }) {
  const total = 30;
  const pct = (seconds / total) * 100;
  const r = 80;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Rest</div>
      <div className="relative mt-6 h-48 w-48">
       <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
           <circle cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/10" />
           <circle
             cx="100" cy="100" r={r}
             fill="none" stroke="url(#rest-grad)" strokeWidth="10" strokeLinecap="round"
             strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
             style={{ transition: "stroke-dashoffset 1s linear" }}
           />
           <defs>
             <linearGradient id="rest-grad" x1="0" y1="0" x2="1" y2="1">
               <stop offset="0%" stopColor="#00F5A0" />
               <stop offset="100%" stopColor="#06B6D4" />
             </linearGradient>
           </defs>
         </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{seconds}</div>
          <div className="text-xs text-muted-foreground">seconds</div>
        </div>
      </div>
       <Button onClick={onSkip} variant="outline" className="mt-8 border-white/20 hover:bg-white/10 transition-all">
         <Play className="mr-2 h-4 w-4" /> Skip rest
       </Button>
    </div>
  );
}
