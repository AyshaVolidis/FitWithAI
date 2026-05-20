import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Dumbbell, Play } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workouts")({
  head: () => ({ meta: [{ title: "Workouts — FitAI" }] }),
  component: Workouts,
});

type Session = { id: string; date: string; status: string; duration_actual: number | null; rating: number | null; plan_json: { segments: { title: string }[]; total_duration_seconds: number } };

function Workouts() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("workout_sessions")
        .select("id, date, status, duration_actual, rating, plan_json")
        .eq("user_id", user.id).order("date", { ascending: false }).limit(50);
      setSessions((data ?? []) as unknown as Session[]);
      setLoading(false);
    })();
  }, []);

  // Build 7-day strip
  const days: { date: string; dow: string; dom: number; done: boolean; isToday: boolean }[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const completedDates = new Set(sessions.filter((s) => s.status === "completed").map((s) => s.date));
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    days.push({
      date: k,
      dow: d.toLocaleDateString(undefined, { weekday: "short" }),
      dom: d.getDate(),
      done: completedDates.has(k),
      isToday: k === todayStr,
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
      <h1 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>Workouts</h1>
      <p className="text-sm text-muted-foreground">Your weekly rhythm</p>

       {/* Week strip */}
       <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass-strong rounded-2xl p-4 border border-white/20 border-glow transition-all hover-lift">
         <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
           <Calendar className="h-3.5 w-3.5" /> This week
         </div>
         <div className="mt-3 grid grid-cols-7 gap-2">
           {days.map((d) => (
             <div key={d.date} className={"flex flex-col items-center rounded-xl border px-2 py-3 text-xs transition-all " +
               (d.isToday ? "border-primary bg-primary/10 glow-neon" : d.done ? "border-primary/30 bg-primary/5" : "border-white/20 bg-white/5")}>
               <span className="text-[10px] uppercase text-muted-foreground">{d.dow}</span>
               <span className="mt-1 text-base font-semibold">{d.dom}</span>
               <div className={"mt-1 h-1.5 w-1.5 rounded-full " + (d.done ? "bg-primary" : "bg-white/20")} />
             </div>
           ))}
         </div>
         <div className="mt-3 flex justify-between text-xs text-muted-foreground">
           <span>{days.filter((d) => d.done).length} of 7 days done</span>
           <Link to="/dashboard" className="text-primary hover:underline transition-all">Today's workout →</Link>
         </div>
       </motion.div>

      <h2 className="mt-8 mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">History</h2>
       {loading ? (
         <p className="text-sm text-muted-foreground">Loading…</p>
       ) : sessions.length === 0 ? (
         <div className="glass-strong rounded-2xl p-8 text-center border border-white/20 border-glow transition-all hover-lift">
           <Dumbbell className="mx-auto h-10 w-10 text-muted-foreground" />
           <p className="mt-3 text-sm text-muted-foreground">No workouts yet. Generate your first one!</p>
           <Link to="/dashboard"><div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-neon px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all hover-lift">
             <Play className="h-4 w-4" /> Get started
           </div></Link>
         </div>
       ) : (
         <div className="space-y-2">
           {sessions.map((s) => (
             <div key={s.id} className="glass-strong flex items-center justify-between rounded-xl px-4 py-3 text-sm border border-white/20 transition-all hover-lift">
               <div>
                 <div className="font-medium">{new Date(s.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                 <div className="text-xs text-muted-foreground">
                   {s.plan_json?.segments?.length ?? 0} segments · {Math.round((s.plan_json?.total_duration_seconds ?? 0) / 60)} min
                 </div>
               </div>
               <div className="text-right">
                 <div className={"text-xs font-medium uppercase tracking-wider " + (s.status === "completed" ? "text-primary" : "text-muted-foreground")}>
                   {s.status}
                 </div>
                 {s.rating && <div className="text-xs text-muted-foreground">{s.rating}★</div>}
               </div>
             </div>
           ))}
         </div>
       )}
    </div>
  );
}
