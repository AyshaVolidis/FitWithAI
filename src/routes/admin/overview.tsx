import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Users, Activity, Dumbbell, MessageSquare, Flame, Zap, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  getOverviewKPIs, getDailyActiveUsers, getWorkoutsPerDayThisWeek,
  getUsersByGoal, getRecentActivity,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/overview")({
  head: () => ({ meta: [{ title: "Admin Overview — FitAI" }] }),
  component: Overview,
});

const KPI_CARDS = [
  { key: "totalUsers", label: "Total Users", icon: Users, bg: "bg-blue-500/10", iconColor: "text-blue-400" },
  { key: "activeToday", label: "Active Today", icon: Activity, bg: "bg-green-500/10", iconColor: "text-green-400" },
  { key: "workoutsThisWeek", label: "Workouts This Week", icon: Dumbbell, bg: "bg-orange-500/10", iconColor: "text-orange-400" },
  { key: "chatMessagesToday", label: "AI Chat Messages Today", icon: MessageSquare, bg: "bg-purple-500/10", iconColor: "text-purple-400" },
  { key: "avgCalories", label: "Avg Calories/User", icon: Flame, bg: "bg-red-500/10", iconColor: "text-red-400" },
  { key: "streakUsers", label: "Streak ≥7 Days", icon: Zap, bg: "bg-yellow-500/10", iconColor: "text-yellow-400" },
] as const;

const GOAL_COLORS = ["#7C3AED", "#06B6D4", "#22C55E", "#F59E0B", "#EF4444", "#94A3B8"];

const TYPE_COLORS: Record<string, string> = {
  workout: "bg-blue-400",
  meal: "bg-green-400",
  chat: "bg-purple-400",
};

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    if (diff === 0) { setDisplay(value); return; }

    let startTime: number | null = null;
    const raf = (now: number) => {
      if (!startTime) startTime = now;
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) requestAnimationFrame(raf);
      else prev.current = value;
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Overview() {
  const overviewKPIFn = useServerFn(getOverviewKPIs);
  const dailyActiveUsersFn = useServerFn(getDailyActiveUsers);
  const workoutsPerDayFn = useServerFn(getWorkoutsPerDayThisWeek);
  const usersByGoalFn = useServerFn(getUsersByGoal);
  const recentActivityFn = useServerFn(getRecentActivity);

  const [kpi, setKpi] = useState<{
    totalUsers: number; activeToday: number; workoutsThisWeek: number;
    chatMessagesToday: number; avgCalories: number; streakUsers: number;
  }>({ totalUsers: 0, activeToday: 0, workoutsThisWeek: 0, chatMessagesToday: 0, avgCalories: 0, streakUsers: 0 });
  const [dailyUsers, setDailyUsers] = useState<{ date: string; count: number }[]>([]);
  const [workoutsWeek, setWorkoutsWeek] = useState<{ day: string; count: number }[]>([]);
  const [goals, setGoals] = useState<{ goal: string; count: number }[]>([]);
  const [activities, setActivities] = useState<{
    type: string; description: string; timestamp: string; user: string; avatar: string | null;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [k, d, w, g, a] = await Promise.all([
        overviewKPIFn(),
        dailyActiveUsersFn({ data: { days: 30 } }),
        workoutsPerDayFn(),
        usersByGoalFn(),
        recentActivityFn({ data: { limit: 20 } }),
      ]);
      setKpi(k);
      setDailyUsers(d);
      setWorkoutsWeek(w);
      setGoals(g);
      setActivities(a);
    } catch {
      setError("Failed to load overview data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-muted-foreground">Loading overview…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg font-semibold text-destructive">{error}</p>
          <button onClick={load} className="text-sm text-primary underline underline-offset-4 hover:text-primary/80">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const kpiArray = KPI_CARDS.map((card) => ({
    ...card,
    value: kpi[card.key as keyof typeof kpi] as number,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Admin Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your fitness empire at a glance</p>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiArray.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
          >
            <Card className={cn("glass-strong border-glow hover-lift", card.bg)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">{card.label}</span>
                  <card.icon className={cn("h-4 w-4", card.iconColor)} />
                </div>
                <div className="mt-3 text-2xl font-bold">
                  <AnimatedNumber value={card.value} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <Card className="glass-strong border-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Daily Active Users (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyUsers} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(17,24,39,0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "#F8FAFC", fontWeight: 600 }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#7C3AED" strokeWidth={2} fill="url(#dauGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-1"
        >
          <Card className="glass-strong border-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Workouts Per Day (This Week)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workoutsWeek} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(17,24,39,0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "#F8FAFC", fontWeight: 600 }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
                      {workoutsWeek.map((_, i) => (
                        <Cell key={i} fill={i === workoutsWeek.length - 1 ? "#7C3AED" : "#06B6D4"} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-1"
        >
          <Card className="glass-strong border-glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-warning" />
                Users by Fitness Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={goals}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="count"
                        nameKey="goal"
                        stroke="transparent"
                      >
                        {goals.map((_, i) => (
                          <Cell key={i} fill={GOAL_COLORS[i % GOAL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "rgba(17,24,39,0.9)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "0.75rem",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {goals.map((g, i) => (
                    <div key={g.goal} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: GOAL_COLORS[i % GOAL_COLORS.length] }}
                      />
                      <span className="capitalize">{g.goal.replace(/_/g, " ")}</span>
                      <span className="font-semibold text-foreground">{g.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mt-8"
      >
        <Card className="glass-strong border-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-success" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 px-6 pb-6">
                {activities.map((act, i) => (
                  <div
                    key={`${act.type}-${act.timestamp}-${i}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/5"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        {act.avatar ? (
                          <AvatarImage src={act.avatar} alt={act.user} />
                        ) : (
                          <AvatarFallback className="text-[10px]">
                            {act.user.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div
                        className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                          TYPE_COLORS[act.type] ?? "bg-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{act.description}</p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] text-muted-foreground">
                      {relativeTime(act.timestamp)}
                    </span>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No recent activity
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
