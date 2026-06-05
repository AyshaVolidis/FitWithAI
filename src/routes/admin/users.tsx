import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { getUsers, getUserDetail } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Search, Flame, ChevronLeft, ChevronRight, Star, Dumbbell, Apple, MessageSquare, Calendar } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — FitAI Admin" }] }),
  component: UsersPage,
});

type Filter = "all" | "active" | "inactive" | "new";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "New", value: "new" },
];

const GOAL_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline" | "success" | "cyan"> = {
  lose_weight: "destructive",
  build_muscle: "default",
  improve_endurance: "cyan",
  general_fitness: "success",
  flexibility: "secondary",
};

const GOAL_LABELS: Record<string, string> = {
  lose_weight: "Lose Weight",
  build_muscle: "Build Muscle",
  improve_endurance: "Endurance",
  general_fitness: "General Fitness",
  flexibility: "Flexibility",
};

function GoalBadge({ goal }: { goal: string | null }) {
  const g = goal ?? "not_set";
  const color = GOAL_COLORS[g] ?? "outline";
  const label = GOAL_LABELS[g] ?? "Not set";
  return <Badge variant={color as never}>{label}</Badge>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-3 w-3", i < Math.round(rating) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30")} />
      ))}
    </div>
  );
}

function DailyUsageChart({ dates }: { dates: string[] }) {
  const usageSet = new Set(dates);
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="flex gap-[3px] items-end h-8">
      {days.map((day) => {
        const active = usageSet.has(day);
        return (
          <div
            key={day}
            title={day}
            className={cn(
              "w-[6px] rounded-sm transition-all",
              active ? "bg-green-500 h-full" : "bg-muted h-1/3"
            )}
          />
        );
      })}
    </div>
  );
}

function UsersPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const usersFn = useServerFn(getUsers);
  const detailFn = useServerFn(getUserDetail);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    usersFn({ data: { search: debouncedSearch, filter, page, pageSize } })
      .then((res) => { setUsers(res.users); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [debouncedSearch, filter, page, pageSize]);

  useEffect(() => {
    if (!selectedUserId || !detailOpen) return;
    setDetailLoading(true);
    setUserDetail(null);
    detailFn({ data: { userId: selectedUserId } })
      .then(setUserDetail)
      .catch(() => {})
      .finally(() => setDetailLoading(false));
  }, [selectedUserId, detailOpen]);

  const handleView = (userId: string) => {
    setSelectedUserId(userId);
    setDetailOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Users</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total users</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={cn(
              "rounded-full px-5 py-1.5 text-sm font-semibold transition-all border border-border hover-lift",
              filter === f.value
                ? "bg-gradient-neon text-primary-foreground shadow-pop border-transparent"
                : "text-muted-foreground hover:text-foreground hover:border-primary/50 bg-background/50"
            )}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-10"
        />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6 glass-strong rounded-2xl border-glow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Goal</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Streak</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-8 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No users found</TableCell>
              </TableRow>
            ) : (
              users.map((user: any) => {
                const initials = user.name
                  ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                  : "U";
                const lastActive = user.updated_at ?? user.created_at;
                const isActive = user.is_active ?? false;

                return (
                  <TableRow key={user.id} className="hover-lift">
                    <TableCell>
                      <Avatar className="h-8 w-8">
                        {user.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.name ?? ""} /> : null}
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <GoalBadge goal={user.goal} />
                    </TableCell>
                    <TableCell>
                      {user.fitness_level ? (
                        <span className="capitalize text-sm">{user.fitness_level}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-accent" />
                        <span className="font-semibold">{user.streak ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lastActive ? formatDistanceToNow(new Date(lastActive), { addSuffix: true }) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", isActive ? "bg-green-500" : "bg-gray-400")} />
                        <span className="text-sm">{isActive ? "Active" : "Inactive"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleView(user.id)}>View</Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
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
      </motion.div>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg md:max-w-xl p-0">
          <ScrollArea className="h-full">
            <div className="p-6">
              {detailLoading || !userDetail ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-56" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
                    ))}
                  </div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <SheetHeader className="mb-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        {userDetail.profile?.avatar_url ? <AvatarImage src={userDetail.profile.avatar_url} alt={userDetail.profile?.name ?? ""} /> : null}
                        <AvatarFallback>
                          {userDetail.profile?.name
                            ? userDetail.profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <SheetTitle className="text-lg">{userDetail.profile?.name ?? "Unknown"}</SheetTitle>
                        <p className="text-sm text-muted-foreground">{userDetail.profile?.email}</p>
                      </div>
                    </div>
                  </SheetHeader>

                  <div className="grid grid-cols-2 gap-3">
                    <Card className="border-glow hover-lift">
                      <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                        <Dumbbell className="h-5 w-5 text-accent mb-1" />
                        <span className="text-xl font-bold">{userDetail.stats?.totalWorkouts ?? 0}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Workouts</span>
                      </CardContent>
                    </Card>
                    <Card className="border-glow hover-lift">
                      <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                        <Calendar className="h-5 w-5 text-green-500 mb-1" />
                        <span className="text-xl font-bold">{userDetail.stats?.completedWorkouts ?? 0}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</span>
                      </CardContent>
                    </Card>
                    <Card className="border-glow hover-lift">
                      <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                        <Star className="h-5 w-5 text-yellow-500 mb-1" />
                        <span className="text-xl font-bold">{(userDetail.stats?.avgRating ?? 0).toFixed(1)}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Rating</span>
                      </CardContent>
                    </Card>
                    <Card className="border-glow hover-lift">
                      <CardContent className="flex flex-col items-center justify-center p-4 text-center">
                        <MessageSquare className="h-5 w-5 text-primary mb-1" />
                        <span className="text-xl font-bold">{userDetail.stats?.totalMessages ?? 0}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Messages</span>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Last 3 Workouts</h3>
                    {userDetail.workouts?.length > 0 ? (
                      <div className="space-y-2">
                        {userDetail.workouts.map((w: any) => (
                          <div key={w.id} className="glass-strong rounded-xl p-3 border-glow flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium">{w.date ? new Date(w.date).toLocaleDateString() : "—"}</div>
                              <div className="flex items-center gap-2 mt-1">
                                {w.rating ? <StarRating rating={w.rating} /> : null}
                              </div>
                            </div>
                            <Badge variant={w.status === "completed" ? "success" as never : w.status === "in_progress" ? "cyan" as never : "outline"}>
                              {(w.status ?? "pending").replace(/_/g, " ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No workouts yet</p>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Last 3 Meals</h3>
                    {userDetail.meals?.length > 0 ? (
                      <div className="space-y-2">
                        {userDetail.meals.map((m: any) => (
                          <div key={m.id} className="glass-strong rounded-xl p-3 border-glow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Apple className="h-4 w-4 text-accent" />
                                <span className="text-sm font-medium">{m.name}</span>
                              </div>
                              {m.meal_type && (
                                <Badge variant="outline" className="text-[10px] capitalize">{m.meal_type}</Badge>
                              )}
                            </div>
                            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                              <span>{m.calories ?? 0} cal</span>
                              <span>P {m.protein_g ?? 0}g</span>
                              <span>C {m.carbs_g ?? 0}g</span>
                              <span>F {m.fats_g ?? 0}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No meals logged</p>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent Chat</h3>
                    {userDetail.recentChat?.length > 0 ? (
                      <div className="space-y-2">
                        {[...userDetail.recentChat].reverse().slice(0, 5).map((msg: any) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                              msg.role === "user"
                                ? "ml-auto bg-primary/20 text-foreground rounded-br-md"
                                : "mr-auto bg-muted/70 text-foreground rounded-bl-md"
                            )}
                          >
                            {msg.content}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No messages</p>
                    )}
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Daily Usage <span className="text-[10px] font-normal">(30 days)</span>
                    </h3>
                    {userDetail.dailyUsage?.length > 0 ? (
                      <div className="glass-strong rounded-xl p-4 border-glow">
                        <DailyUsageChart dates={(userDetail.dailyUsage ?? []).map((u: any) => u.date)} />
                        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                          <span>30 days ago</span>
                          <span>Today</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No usage data</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
