import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { logWeight } from "@/lib/nutrition.functions";
import { listRecentInsights } from "@/lib/insights.functions";
import { MarkdownLite } from "@/components/WeeklyInsightCard";
import { Flame, Calendar, Scale, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress — FitAI" }] }),
  component: Progress,
});

function Progress() {
  const [sessions, setSessions] = useState<{ date: string; status: string; rating: number | null; duration_actual: number | null }[]>([]);
  const [streak, setStreak] = useState(0);
  const [weights, setWeights] = useState<{ date: string; weight_kg: number }[]>([]);
  const [insights, setInsights] = useState<{ week_start: string; content: string }[]>([]);
  const [openWeek, setOpenWeek] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [w, setW] = useState("");
  const logWeightFn = useServerFn(logWeight);
  const listInsightsFn = useServerFn(listRecentInsights);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [sRes, wRes] = await Promise.all([
      supabase.from("workout_sessions").select("date, status, rating, duration_actual").eq("user_id", user.id).order("date", { ascending: false }).limit(90),
      supabase.from("weight_logs").select("date, weight_kg").eq("user_id", user.id).order("date").limit(60),
    ]);
    const s = sRes.data ?? [];
    setSessions(s);
    const dates = new Set(s.filter((x) => x.status === "completed").map((x) => x.date));
    let st = 0; const cur = new Date();
    while (dates.has(cur.toISOString().slice(0, 10))) { st++; cur.setDate(cur.getDate() - 1); }
    setStreak(st);
    setWeights((wRes.data ?? []).map((x) => ({ date: x.date, weight_kg: Number(x.weight_kg) })));
  };

  useEffect(() => {
    load();
    listInsightsFn().then((d) => setInsights(d ?? [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Heatmap
  const days: { date: string; done: boolean }[] = [];
  const completedSet = new Set(sessions.filter((s) => s.status === "completed").map((s) => s.date));
  for (let i = 41; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    days.push({ date: k, done: completedSet.has(k) });
  }

  // Weekly volume (last 6 weeks)
  const weeks: { week: string; minutes: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(); start.setDate(start.getDate() - i * 7 - 6);
    const end = new Date(); end.setDate(end.getDate() - i * 7);
    const startK = start.toISOString().slice(0, 10);
    const endK = end.toISOString().slice(0, 10);
    const minutes = sessions
      .filter((s) => s.status === "completed" && s.date >= startK && s.date <= endK)
      .reduce((acc, s) => acc + Math.round((s.duration_actual ?? 0) / 60), 0);
    weeks.push({ week: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }), minutes });
  }

  const submitWeight = async () => {
    const n = parseFloat(w);
    if (!n) return;
    try {
      await logWeightFn({ data: { weight_kg: n } });
      toast.success("Weight logged");
      setOpen(false); setW("");
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
      <h1 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>Progress</h1>
      <p className="text-sm text-muted-foreground">Trends, streaks, and personal bests</p>

      {/* Stats row */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat icon={<Flame className="h-4 w-4 text-primary" />} label="Current streak" value={streak} suffix="days" />
        <Stat icon={<Calendar className="h-4 w-4 text-accent" />} label="Last 30 days" value={sessions.filter((s) => s.status === "completed" && s.date >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)).length} suffix="workouts" />
        <Stat icon={<Scale className="h-4 w-4 text-primary" />} label="Latest weight" value={weights.length ? weights[weights.length - 1].weight_kg : "—"} suffix={weights.length ? "kg" : ""} />
      </motion.div>

       {/* Weight chart */}
       <div className="mt-6 glass-strong rounded-2xl p-6 border border-white/20 border-glow transition-all hover-lift">
         <div className="flex items-center justify-between">
           <div>
             <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Weight</h2>
             <p className="text-xs text-muted-foreground">Track your trend over time</p>
           </div>
           <Dialog open={open} onOpenChange={setOpen}>
             <DialogTrigger asChild>
               <Button size="sm" variant="outline" className="border-white/20"><Plus className="mr-1 h-3 w-3" /> Log</Button>
             </DialogTrigger>
             <DialogContent className="glass-strong border border-white/20">
               <DialogHeader><DialogTitle>Log weight</DialogTitle></DialogHeader>
               <div className="space-y-3">
                 <Input type="number" step="0.1" placeholder="kg" value={w} onChange={(e) => setW(e.target.value)} className="bg-white/5 border-white/20" />
                 <Button className="w-full bg-gradient-neon text-primary-foreground hover:opacity-90 transition-all" onClick={submitWeight}>Save</Button>
               </div>
             </DialogContent>
           </Dialog>
         </div>
        <div className="mt-4 h-48">
          {weights.length < 2 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Log your weight twice to see a trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weights}>
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "rgba(20,20,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                <Line type="monotone" dataKey="weight_kg" stroke="#00F5A0" strokeWidth={2} dot={{ fill: "#00F5A0", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

       {/* Volume bar */}
       <div className="mt-4 glass-strong rounded-2xl p-6 border border-white/20 border-glow transition-all hover-lift">
         <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Weekly volume</h2>
        <div className="mt-4 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeks}>
              <XAxis dataKey="week" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "rgba(20,20,28,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
              <Bar dataKey="minutes" fill="url(#bar-grad)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="bar-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F5A0" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

       {/* Heatmap */}
       <div className="mt-4 glass-strong rounded-2xl p-6 border border-white/20 border-glow transition-all hover-lift">
         <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Last 42 days</h2>
         <div className="mt-3 grid grid-cols-14 gap-1" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
           {days.map((d) => (
             <div key={d.date} title={d.date} className={"aspect-square rounded " + (d.done ? "bg-gradient-neon glow-neon" : "bg-white/10 border border-white/20")} />
           ))}
         </div>
       </div>

       {/* Coach Insights history */}
       {insights.length > 0 && (
         <div className="mt-4 glass-strong rounded-2xl p-6 border border-white/20 border-glow transition-all hover-lift">
           <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Coach insights</h2>
           <div className="mt-3 space-y-2">
             {insights.map((it) => {
               const isOpen = openWeek === it.week_start;
               const start = new Date(it.week_start);
               const end = new Date(start); end.setDate(end.getDate() + 6);
               const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
               return (
                 <div key={it.week_start} className="rounded-xl border border-white/20 bg-white/[0.03] transition-all">
                   <button
                     onClick={() => setOpenWeek(isOpen ? null : it.week_start)}
                     className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-white/[0.05] transition-all"
                   >
                     <span className="font-medium">Week of {fmt(start)} – {fmt(end)}</span>
                     <span className="text-xs text-muted-foreground">{isOpen ? "Hide" : "Read"}</span>
                   </button>
                   {isOpen && (
                     <div className="border-t border-white/20 px-4 pb-4 pt-2">
                       <MarkdownLite text={it.content} />
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
         </div>
       )}
    </div>
  );
}

function Stat({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: number | string; suffix?: string }) {
   return (
     <div className="glass-strong rounded-2xl p-5 border border-white/20 border-glow transition-all hover-lift">
       <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">{icon} {label}</div>
       <div className="mt-2 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
         {value}{suffix && <span className="ml-1 text-base font-normal text-muted-foreground">{suffix}</span>}
       </div>
     </div>
   );
 }
