import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Dumbbell, Clock, Target, CheckCircle, Star, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkoutStats, getWorkouts, getTopExercises } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/workouts")({
  component: WorkoutsPage,
});

const GOAL_LABELS: Record<string, string> = {
  all: "All",
  lose_weight: "Lose Weight",
  build_muscle: "Build Muscle",
  improve_endurance: "Improve Endurance",
  general_fitness: "General Fitness",
  flexibility: "Flexibility",
};

const GOALS = ["all", "lose_weight", "build_muscle", "improve_endurance", "general_fitness", "flexibility"];

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  skipped: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  partial: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const DIFFICULTY_BADGE: Record<string, string> = {
  too_easy: "bg-green-500/15 text-green-400 border-green-500/30",
  just_right: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  too_hard: "bg-red-500/15 text-red-400 border-red-500/30",
};

const PHASE_CONFIG: Record<string, { label: string; className: string }> = {
  warmup: { label: "W", className: "border-emerald-500/30 bg-emerald-500/20 text-emerald-400" },
  main: { label: "M", className: "border-blue-500/30 bg-blue-500/20 text-blue-400" },
  cooldown: { label: "C", className: "border-orange-500/30 bg-orange-500/20 text-orange-400" },
};

function WorkoutsPage() {
  const [stats, setStats] = useState<any>(null);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [topExercises, setTopExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState("all");
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const statsFn = useServerFn(getWorkoutStats);
  const workoutsFn = useServerFn(getWorkouts);
  const topFn = useServerFn(getTopExercises);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t, w] = await Promise.all([
        statsFn(),
        topFn(),
        workoutsFn({ data: { goal, minRating, page, pageSize } }),
      ]);
      setStats(s);
      setTopExercises(t);
      setWorkouts(w.workouts);
      setTotal(w.total);
    } catch {
      setError("Failed to load workout data.");
    } finally {
      setLoading(false);
    }
  }, [goal, minRating, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / pageSize);

  const getPhases = (plan: any): string[] => {
    if (!plan?.segments) return [];
    return Array.from(new Set(plan.segments.map((s: any) => s.phase))) as string[];
  };

  const handleMinRating = (star: number) => {
    setMinRating((prev) => (prev === star ? 0 : star));
  };

  const STAT_CARDS = [
    { label: "Total Sessions", value: stats?.totalSessions.toLocaleString() ?? "—", icon: Dumbbell },
    { label: "Avg Duration", value: stats ? `${stats.avgDuration} min` : "—", icon: Clock },
    { label: "Most Common Goal", value: stats ? GOAL_LABELS[stats.mostCommonGoal] ?? stats.mostCommonGoal : "—", icon: Target },
    { label: "Completion Rate", value: stats ? `${stats.completionRate}%` : "—", icon: CheckCircle },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0 space-y-6">
            <Skeleton className="h-9 w-40" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-strong rounded-2xl border-glow p-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-2 h-7 w-16" />
                </div>
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <div className="hidden lg:block">
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Workouts
          </motion.h1>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {STAT_CARDS.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-strong rounded-2xl border-glow p-4 hover-lift"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </div>
                <div className="mt-1.5 text-xl font-bold tracking-tight">{item.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Goal</span>
              <Select value={goal} onValueChange={(v) => setGoal(v)}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g} value={g} className="text-xs">
                      {GOAL_LABELS[g]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Min Rating</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleMinRating(star)}
                    className={cn(
                      "rounded-md p-0.5 transition-all hover:scale-110",
                      star <= minRating
                        ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"
                        : "text-muted-foreground/30 hover:text-muted-foreground/60"
                    )}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Difficulty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        No workouts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    workouts.map((w: any) => (
                      <TableRow key={w.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                              {(w.profiles?.name ?? "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{w.profiles?.name ?? "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(w.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("capitalize text-[10px]", STATUS_BADGE[w.status] ?? "")}>
                            {w.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {w.duration_actual != null ? `${w.duration_actual} min` : "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {getPhases(w.plan_json).map((phase) => {
                              const cfg = PHASE_CONFIG[phase];
                              if (!cfg) return null;
                              return (
                                <span
                                  key={phase}
                                  className={cn(
                                    "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold",
                                    cfg.className
                                  )}
                                >
                                  {cfg.label}
                                </span>
                              );
                            })}
                            {getPhases(w.plan_json).length === 0 && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={cn(
                                  "h-3.5 w-3.5",
                                  s <= (w.rating ?? 0)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-none text-muted-foreground/20"
                                )}
                              />
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {w.difficulty_rating ? (
                            <Badge variant="outline" className={cn("text-[10px] capitalize", DIFFICULTY_BADGE[w.difficulty_rating] ?? "")}>
                              {w.difficulty_rating.replace(/_/g, " ")}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages || 1} · {total} total
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  Top Exercises
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <div className="px-1">
                    {topExercises.map((ex: any, i: number) => (
                      <div key={ex.name}>
                        <div className="flex items-center gap-3 px-5 py-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{ex.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {ex.count} use{ex.count !== 1 ? "s" : ""} · {Math.round(ex.totalDuration / 60)} min
                            </div>
                          </div>
                        </div>
                        {i < topExercises.length - 1 && (
                          <div className="mx-5 border-t border-foreground/5" />
                        )}
                      </div>
                    ))}
                    {topExercises.length === 0 && (
                      <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                        No exercise data yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
