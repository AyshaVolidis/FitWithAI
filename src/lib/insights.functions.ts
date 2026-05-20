import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getAiConfig } from "./ai";


// Monday of current week, UTC, ISO date.
export function weekStartISO(d: Date = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  x.setUTCDate(x.getUTCDate() - diff);
  return x.toISOString().slice(0, 10);
}

type AnyClient = SupabaseClient<Database>;

export async function buildAndSaveInsight(
  client: AnyClient,
  userId: string,
): Promise<{ week_start: string; content: string }> {
  const weekStart = weekStartISO();
  const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const [profileRes, weightsRes, foodRes, sessionsRes, prsRes] = await Promise.all([
    client.from("profiles").select("name, goal, fitness_level, weekly_frequency, daily_calorie_target, protein_target_g").eq("id", userId).maybeSingle(),
    client.from("weight_logs").select("date, weight_kg").eq("user_id", userId).gte("date", since).order("date"),
    client.from("food_logs").select("date, calories, protein_g, carbs_g, fats_g").eq("user_id", userId).gte("date", since),
    client.from("workout_sessions").select("date, status, rating, energy_level, duration_actual").eq("user_id", userId).gte("date", since),
    client.from("personal_records").select("exercise_name, weight_kg, reps, achieved_at").eq("user_id", userId).gte("achieved_at", since),
  ]);

  const profile = profileRes.data;
  const weights = weightsRes.data ?? [];
  const foods = foodRes.data ?? [];
  const sessions = sessionsRes.data ?? [];
  const prs = prsRes.data ?? [];

  // Aggregations
  const weightDelta = weights.length >= 2 ? Number(weights[weights.length - 1].weight_kg) - Number(weights[0].weight_kg) : null;
  const latestWeight = weights.length ? Number(weights[weights.length - 1].weight_kg) : null;

  const dayBuckets: Record<string, { cal: number; p: number; c: number; f: number }> = {};
  for (const r of foods) {
    const k = r.date;
    if (!dayBuckets[k]) dayBuckets[k] = { cal: 0, p: 0, c: 0, f: 0 };
    dayBuckets[k].cal += r.calories ?? 0;
    dayBuckets[k].p += Number(r.protein_g ?? 0);
    dayBuckets[k].c += Number(r.carbs_g ?? 0);
    dayBuckets[k].f += Number(r.fats_g ?? 0);
  }
  const loggedDays = Object.keys(dayBuckets).length;
  const avgCal = loggedDays ? Math.round(Object.values(dayBuckets).reduce((s, x) => s + x.cal, 0) / loggedDays) : 0;
  const avgProtein = loggedDays ? Math.round(Object.values(dayBuckets).reduce((s, x) => s + x.p, 0) / loggedDays) : 0;

  const completed = sessions.filter((s) => s.status === "completed");
  const avgEnergy = completed.length ? (completed.reduce((s, x) => s + (x.energy_level ?? 0), 0) / completed.length).toFixed(1) : "—";
  const avgRating = completed.filter((c) => c.rating).length
    ? (completed.reduce((s, x) => s + (x.rating ?? 0), 0) / completed.filter((c) => c.rating).length).toFixed(1)
    : "—";
  const totalMin = Math.round(completed.reduce((s, x) => s + (x.duration_actual ?? 0), 0) / 60);

  const summary = [
    `Goal: ${profile?.goal ?? "general fitness"}, Level: ${profile?.fitness_level ?? "—"}`,
    `Workouts completed: ${completed.length} / ${profile?.weekly_frequency ?? 3} target (${totalMin} min total, avg energy ${avgEnergy}, avg rating ${avgRating})`,
    `Nutrition: logged ${loggedDays}/7 days. Avg ${avgCal} kcal vs target ${profile?.daily_calorie_target ?? "?"} kcal. Avg ${avgProtein}g protein vs target ${profile?.protein_target_g ?? "?"}g.`,
    `Weight: ${latestWeight ?? "not logged"}${latestWeight ? "kg" : ""}${weightDelta != null ? ` (${weightDelta >= 0 ? "+" : ""}${weightDelta.toFixed(1)}kg this week)` : ""}`,
    `New PRs: ${prs.length ? prs.map((p) => `${p.exercise_name} ${p.weight_kg ?? ""}kg×${p.reps ?? ""}`).join(", ") : "none"}`,
  ].join("\n");

  const sys = `You are FitAI's weekly coach. Given a user's last 7 days, write a concise, motivating, specific weekly review for them. Use markdown with these exact section headings:

## Wins
## Trends
## Focus
## Next Week

Each section: 1-3 short bullets, plain language, reference the actual numbers, encourage progress without flattery. Total under 250 words.`;

  const aiConfig = getAiConfig();
  const aiResp = await fetch(aiConfig.url, {
    method: "POST",
    headers: aiConfig.headers,
    body: JSON.stringify({
      model: aiConfig.model,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Here is my data for the past 7 days:\n\n${summary}` },
      ],
    }),
  });


  if (!aiResp.ok) {
    if (aiResp.status === 429) throw new Error("AI rate limit reached. Try again in a moment.");
    throw new Error(`AI generation failed (${aiResp.status})`);
  }
  const json = await aiResp.json() as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty AI response");

  const { error: upErr } = await client
    .from("weekly_insights")
    .upsert({ user_id: userId, week_start: weekStart, content }, { onConflict: "user_id,week_start" });
  if (upErr) throw new Error(upErr.message);

  return { week_start: weekStart, content };
}

export const getCurrentWeeklyInsight = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const ws = weekStartISO();
    const { data, error } = await supabase
      .from("weekly_insights")
      .select("week_start, content, created_at")
      .eq("user_id", userId)
      .eq("week_start", ws)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const generateWeeklyInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    return buildAndSaveInsight(supabase, userId);
  });

export const listRecentInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("weekly_insights")
      .select("week_start, content, created_at")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(6);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
