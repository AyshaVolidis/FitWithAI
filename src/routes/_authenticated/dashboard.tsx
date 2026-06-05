import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generatePlan } from "@/lib/generatePlan.functions";
import { logWater } from "@/lib/nutrition.functions";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Flame, Droplet, Apple, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CalorieRing } from "@/components/CalorieRing";
import { WeeklyInsightCard } from "@/components/WeeklyInsightCard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Today — FitAI" }] }),
  component: Dashboard,
});

const ENERGY = [
  { v: 1, emoji: "😴", label: "Drained" },
  { v: 2, emoji: "🥱", label: "Low" },
  { v: 3, emoji: "🙂", label: "OK" },
  { v: 4, emoji: "💪", label: "Good" },
  { v: 5, emoji: "🔥", label: "Pumped" },
];

type Plan = { segments: { phase: string; video_id: string; title: string; thumbnail?: string; duration_seconds: number }[]; total_duration_seconds: number; energy_level: number };

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name: string | null; onboarded_at: string | null; daily_calorie_target: number | null } | null>(null);
  const [session, setSession] = useState<{ id: string; plan_json: Plan; status: string } | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [streak, setStreak] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [waterMl, setWaterMl] = useState(0);
  const generateFn = useServerFn(generatePlan);
  const waterFn = useServerFn(logWater);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);

    const [profRes, sessionRes, completedRes, foodRes, waterRes] = await Promise.all([
      supabase.from("profiles").select("name, onboarded_at, daily_calorie_target").eq("id", user.id).maybeSingle(),
      supabase.from("workout_sessions").select("id, plan_json, status").eq("user_id", user.id).eq("date", today).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("workout_sessions").select("date").eq("user_id", user.id).eq("status", "completed").order("date", { ascending: false }).limit(60),
      supabase.from("food_logs").select("calories").eq("user_id", user.id).eq("date", today),
      supabase.from("water_logs").select("amount_ml").eq("user_id", user.id).eq("date", today),
    ]);

    if (!profRes.data?.onboarded_at) {
      if (user.email === "admin@admin.co") { navigate({ to: "/admin" }); return; }
      navigate({ to: "/onboarding" }); return;
    }
    setProfile(profRes.data);
    if (sessionRes.data) setSession({ id: sessionRes.data.id, plan_json: sessionRes.data.plan_json as unknown as Plan, status: sessionRes.data.status });

    const dates = new Set((completedRes.data ?? []).map((c) => c.date));
    let s = 0; const cur = new Date();
    while (dates.has(cur.toISOString().slice(0, 10))) { s++; cur.setDate(cur.getDate() - 1); }
    setStreak(s);

    setTodayCalories((foodRes.data ?? []).reduce((sum, f) => sum + (f.calories ?? 0), 0));
    setWaterMl((waterRes.data ?? []).reduce((sum, w) => sum + (w.amount_ml ?? 0), 0));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleGenerate = async () => {
    if (energy == null) return toast.error("Pick your energy level first");
    setGenerating(true);
    try {
      const res = await generateFn({ data: { energyLevel: energy } });
      setSession({ id: res.sessionId, plan_json: res.plan as Plan, status: "pending" });
      toast.success("Your plan is ready!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setGenerating(false);
    }
  };

  const addWater = async (ml: number) => {
    setWaterMl((w) => w + ml);
    try { await waterFn({ data: { amount_ml: ml } }); }
    catch { toast.error("Couldn't log water"); }
  };

  const calorieTarget = profile?.daily_calorie_target ?? 2000;
  const waterTarget = 2500;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Hey {profile?.name ?? "there"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full glass-strong px-4 py-2 text-sm border-glow hover-lift">
          <Flame className="h-4 w-4 text-accent" /> <span className="font-semibold">{streak}</span>
          <span className="text-muted-foreground">day streak</span>
        </div>
      </motion.div>

      {/* Weekly AI insight */}
      <div className="mt-6">
        <WeeklyInsightCard />
      </div>

      {/* Top stats grid */}
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-strong rounded-2xl p-6 border-glow hover-lift">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Calories</div>
            <Apple className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-4 flex justify-center">
            <CalorieRing value={todayCalories} target={calorieTarget} size={140} />
          </div>
          <Link to="/nutrition" className="mt-4 block text-center text-xs text-primary hover:text-accent transition-colors font-semibold">View nutrition →</Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-strong rounded-2xl p-6 border-glow hover-lift">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Water intake</div>
            <Droplet className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-3xl font-bold">{(waterMl / 1000).toFixed(1)}</span>
            <span className="text-sm text-muted-foreground">/ {waterTarget / 1000}L</span>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-background/50 border border-border">
            <motion.div
              key={waterMl}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (waterMl / waterTarget) * 100)}%` }}
              className="h-full bg-gradient-to-r from-accent via-primary to-accent"
            />
          </div>
          <div className="mt-4 flex gap-2">
            {[250, 500].map((ml) => (
              <button key={ml} onClick={() => addWater(ml)} className="flex-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all hover-lift">
                +{ml}ml
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-strong rounded-2xl p-6 border-glow hover-lift">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Quick actions</div>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-4 space-y-2">
            <Link to="/chat" className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-all hover-lift">
              <MessageSquare className="h-4 w-4" /> Ask coach
            </Link>
            <Link to="/nutrition" className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2.5 text-sm font-semibold text-accent hover:bg-accent/20 transition-all hover-lift">
              <Plus className="h-4 w-4" /> Log meal
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Workout of the day */}
      {!session && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 glass-strong rounded-2xl p-8 border-glow">
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>How's your energy today?</h2>
          <p className="mt-2 text-sm text-muted-foreground">We'll adapt your workout to match.</p>
          <div className="mt-6 grid grid-cols-5 gap-3">
            {ENERGY.map((e) => (
              <button
                key={e.v}
                onClick={() => setEnergy(e.v)}
                className={cn(
                  "flex flex-col items-center rounded-xl border px-3 py-4 text-xs font-semibold transition-all hover-lift",
                  energy === e.v
                    ? "border-primary/50 bg-gradient-to-br from-primary/20 to-primary/10 glow-neon"
                    : "border-border bg-background/50 hover:bg-background/70 hover:border-primary/50"
                )}
              >
                <span className="text-3xl">{e.emoji}</span>
                <span className="mt-2 text-[11px]">{e.label}</span>
              </button>
            ))}
          </div>
          <Button
            onClick={handleGenerate}
            variant="gradient"
            className="mt-8 w-full"
            size="lg"
            disabled={generating}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {generating ? "Generating your plan…" : "Generate today's workout"}
          </Button>
        </motion.div>
      )}

      {session && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 space-y-4">
          <div className="relative overflow-hidden rounded-2xl glass-strong p-8 border-glow" style={{ backgroundImage: "var(--gradient-hero)" }}>
            <div className="text-xs uppercase tracking-wider text-accent font-semibold">Today's session</div>
            <div className="mt-3 text-5xl font-black" style={{ fontFamily: "var(--font-display)" }}>
              {Math.round(session.plan_json.total_duration_seconds / 60)} <span className="text-lg text-muted-foreground font-normal">min</span>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{session.plan_json.segments.length} segments</div>
            <Button onClick={() => navigate({ to: "/player", search: { id: session.id } })} variant="gradient" size="lg" className="mt-6">
              <Play className="mr-2 h-4 w-4" /> {session.status === "in_progress" ? "Resume workout" : "Start workout"}
            </Button>
          </div>

          {session.plan_json.segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-4 glass-strong rounded-2xl p-5 border-glow hover-lift transition-all">
              <div className="aspect-video w-36 flex-shrink-0 overflow-hidden rounded-xl bg-muted border border-border">
                <img src={seg.thumbnail || `https://i.ytimg.com/vi/${seg.video_id}/mqdefault.jpg`} alt={seg.title} className="h-full w-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-block rounded-full bg-accent/20 border border-accent/30 px-2 py-1 text-xs font-semibold text-accent uppercase tracking-wider">{seg.phase}</div>
                <div className="mt-2 truncate text-sm font-bold text-foreground">{seg.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{Math.round(seg.duration_seconds / 60)} min</div>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
