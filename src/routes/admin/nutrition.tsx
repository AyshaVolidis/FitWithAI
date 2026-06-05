import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Flame, Zap, CircleDot, Droplet, Search, Activity, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationPrevious, PaginationNext,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { getNutritionSummary, getDailyMacros, getMealLogs } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/nutrition")({
  head: () => ({ meta: [{ title: "Admin Nutrition — FitAI" }] }),
  component: Nutrition,
});

const MEAL_BADGE: Record<string, string> = {
  breakfast: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  lunch: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  dinner: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  snack: "bg-green-500/15 text-green-400 border-green-500/30",
};

function Nutrition() {
  const summaryFn = useServerFn(getNutritionSummary);
  const dailyMacrosFn = useServerFn(getDailyMacros);
  const mealLogsFn = useServerFn(getMealLogs);

  const [summary, setSummary] = useState<any>({ totalCalories: 0, avgProtein: 0, avgCarbs: 0, avgFats: 0, totalWater: 0 });
  const [dailyMacros, setDailyMacros] = useState<any[]>([]);
  const [meals, setMeals] = useState<any>({ meals: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, m, ml] = await Promise.all([
        summaryFn(),
        dailyMacrosFn({ data: { days: 7 } }),
        mealLogsFn({ data: { search, page, pageSize } }),
      ]);
      setSummary(s);
      setDailyMacros(m);
      setMeals(ml);
    } catch (e) {
      setError("Failed to load nutrition data.");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(meals.total / pageSize) || 1;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-muted-foreground">Loading nutrition data…</div>
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Nutrition</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track meals and nutritional intake across all users
        </p>
      </motion.div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <SummaryCard icon={Flame} label="Total Calories" value={summary.totalCalories.toLocaleString()} bg="bg-red-500/10" iconColor="text-red-400" delay={0} />
        <SummaryCard icon={Activity} label="Avg Protein" value={`${summary.avgProtein}g`} bg="bg-blue-500/10" iconColor="text-blue-400" delay={0.05} />
        <SummaryCard icon={Zap} label="Avg Carbs" value={`${summary.avgCarbs}g`} bg="bg-yellow-500/10" iconColor="text-yellow-400" delay={0.1} />
        <SummaryCard icon={CircleDot} label="Avg Fats" value={`${summary.avgFats}g`} bg="bg-orange-500/10" iconColor="text-orange-400" delay={0.15} />
        <SummaryCard icon={Droplet} label="Water Intake" value={`${summary.totalWater.toLocaleString()}ml`} bg="bg-cyan-500/10" iconColor="text-cyan-400" delay={0.2} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8"
      >
        <Card className="glass-strong border-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Daily Macro Breakdown (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyMacros} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#94A3B8" }}
                    tickFormatter={(v: string) => format(new Date(v), "EEE")}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(17,24,39,0.9)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "#F8FAFC", fontWeight: 600 }}
                    formatter={(value: number, name: string) => [`${value}g`, name.charAt(0).toUpperCase() + name.slice(1)]}
                    labelFormatter={(label: string) => format(new Date(label), "EEEE, MMM d")}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span className="text-xs text-muted-foreground">
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </span>
                    )}
                  />
                  <Bar dataKey="protein" name="Protein" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="carbs" name="Carbs" stackId="a" fill="#EAB308" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="fats" name="Fats" stackId="a" fill="#F97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Card className="glass-strong border-glow">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Meal Logs
              </CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search meals or users…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Meal Type</TableHead>
                  <TableHead>Food</TableHead>
                  <TableHead className="text-right">Calories</TableHead>
                  <TableHead className="text-right">P / C / F</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!meals.meals || meals.meals.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No meal logs found
                    </TableCell>
                  </TableRow>
                )}
                {meals.meals.map((meal: any) => (
                  <TableRow key={meal.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          {meal.profiles?.avatar_url ? (
                            <AvatarImage src={meal.profiles.avatar_url} alt={meal.profiles.name} />
                          ) : (
                            <AvatarFallback className="text-[10px]">
                              {(meal.profiles?.name ?? "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span className="text-sm font-medium">
                          {meal.profiles?.name ?? "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize", MEAL_BADGE[meal.meal_type] ?? "")}>
                        {meal.meal_type ?? "snack"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{meal.name}</TableCell>
                    <TableCell className="text-right">{meal.calories ?? 0}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {meal.protein_g ?? 0}g / {meal.carbs_g ?? 0}g / {meal.fats_g ?? 0}g
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(meal.created_at), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <div className="border-t border-border/50 px-6 py-3">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className={cn(page <= 1 && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function SummaryCard({
  icon: Icon, label, value, bg, iconColor, delay,
}: {
  icon: React.ElementType; label: string; value: string; bg: string; iconColor: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className={cn("glass-strong border-glow hover-lift", bg)}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
          <div className="mt-3 text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
