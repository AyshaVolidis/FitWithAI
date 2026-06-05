import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const admin = () => { try { return supabaseAdmin; } catch { return null; } };

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); } catch { return fallback; }
}

export const getOverviewKPIs = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const client = admin();
  if (!client) return { totalUsers: 0, activeToday: 0, workoutsThisWeek: 0, chatMessagesToday: 0, avgCalories: 0, streakUsers: 0 };

  return safeQuery(async () => {
    const [profilesRes, usageRes, workoutsRes, chatRes, caloriesRes] = await Promise.all([
      client.from("profiles").select("id", { count: "exact", head: true }),
      client.from("daily_usage").select("user_id", { count: "exact", head: true }).eq("date", today),
      client.from("workout_sessions").select("id", { count: "exact", head: true }).gte("date", weekAgo),
      client.from("chat_messages").select("id", { count: "exact", head: true }).gte("created_at", today),
      client.from("profiles").select("daily_calorie_target"),
    ]);

    const totalUsers = profilesRes.count ?? 0;
    const activeToday = usageRes.count ?? 0;
    const workoutsThisWeek = workoutsRes.count ?? 0;
    const chatMessagesToday = chatRes.count ?? 0;
    const calorieValues = ((caloriesRes.data ?? []) as any[]).map((p: any) => p.daily_calorie_target).filter(Boolean) as number[];
    const avgCalories = calorieValues.length > 0 ? Math.round(calorieValues.reduce((a, b) => a + b, 0) / calorieValues.length) : 0;

    const { data: sessions } = await client
      .from("workout_sessions")
      .select("user_id, date")
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(2000);

    const userCompletion: Record<string, string[]> = {};
    for (const s of sessions ?? []) {
      if (!userCompletion[s.user_id]) userCompletion[s.user_id] = [];
      userCompletion[s.user_id].push(s.date);
    }

    let streakUsers = 0;
    for (const dates of Object.values(userCompletion)) {
      const unique = [...new Set(dates)].sort().reverse();
      let s = 0;
      const cur = new Date(today);
      while (unique.includes(cur.toISOString().slice(0, 10))) {
        s++;
        cur.setDate(cur.getDate() - 1);
      }
      if (s >= 7) streakUsers++;
    }

    return { totalUsers, activeToday, workoutsThisWeek, chatMessagesToday, avgCalories, streakUsers };
  }, { totalUsers: 0, activeToday: 0, workoutsThisWeek: 0, chatMessagesToday: 0, avgCalories: 0, streakUsers: 0 });
});

export const getDailyActiveUsers = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ days: z.number().int().min(1).max(90).default(30) }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return [];
    const startDate = new Date(Date.now() - data.days * 86400000).toISOString().slice(0, 10);

    return safeQuery(async () => {
      const { data: rows } = await client
        .from("daily_usage")
        .select("date, user_id")
        .gte("date", startDate)
        .order("date");

      const map: Record<string, Set<string>> = {};
      for (const r of rows ?? []) {
        if (!map[r.date]) map[r.date] = new Set();
        map[r.date].add(r.user_id);
      }

      return Object.entries(map).map(([date, users]) => ({ date, count: users.size })).sort((a, b) => a.date.localeCompare(b.date));
    }, []);
  });

export const getWorkoutsPerDayThisWeek = createServerFn({ method: "GET" }).handler(async () => {
  const client = admin();
  if (!client) return [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const mondayStr = monday.toISOString().slice(0, 10);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return safeQuery(async () => {
    const { data: rows } = await client
      .from("workout_sessions")
      .select("date")
      .gte("date", mondayStr)
      .order("date");

    const counts: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      counts[d.toISOString().slice(0, 10)] = 0;
    }
    for (const r of rows ?? []) {
      if (counts[r.date] !== undefined) counts[r.date]++;
    }

    return Object.entries(counts).map(([date, count], i) => ({ day: days[i] ?? date, count, date }));
  }, []);
});

export const getUsersByGoal = createServerFn({ method: "GET" }).handler(async () => {
  const client = admin();
  if (!client) return [];

  return safeQuery(async () => {
    const { data } = await client.from("profiles").select("goal");
    const map: Record<string, number> = {};
    for (const p of data ?? []) {
      const g = p.goal ?? "not_set";
      map[g] = (map[g] ?? 0) + 1;
    }
    return Object.entries(map).map(([goal, count]) => ({ goal, count }));
  }, []);
});

export const getRecentActivity = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(100).default(20) }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return [];

    return safeQuery(async () => {
      const [workoutRes, foodRes, chatRes] = await Promise.all([
        client.from("workout_sessions").select("id, user_id, status, created_at, date").order("created_at", { ascending: false }).limit(data.limit),
        client.from("food_logs").select("id, user_id, name, created_at, date").order("created_at", { ascending: false }).limit(data.limit),
        client.from("chat_messages").select("id, user_id, role, content, created_at").order("created_at", { ascending: false }).limit(data.limit),
      ]);

      const userIds = new Set<string>();
      for (const r of [...(workoutRes.data ?? []), ...(foodRes.data ?? []), ...(chatRes.data ?? [])]) userIds.add(r.user_id);
      const { data: profiles } = await client.from("profiles").select("id, name, avatar_url").in("id", [...userIds]);
      const profileMap = Object.fromEntries((profiles ?? [] as any[]).map((p: any) => [p.id, p]));

      const activities: { type: string; description: string; timestamp: string; user: string; avatar: string | null }[] = [];

      for (const w of workoutRes.data ?? []) {
        const p = profileMap[w.user_id];
        activities.push({ type: "workout", description: `${p?.name ?? "Someone"} ${w.status === "completed" ? "completed" : "started"} a workout`, timestamp: w.created_at, user: p?.name ?? "Unknown", avatar: p?.avatar_url ?? null });
      }
      for (const f of foodRes.data ?? []) {
        const p = profileMap[f.user_id];
        activities.push({ type: "meal", description: `${p?.name ?? "Someone"} logged "${f.name}"`, timestamp: f.created_at, user: p?.name ?? "Unknown", avatar: p?.avatar_url ?? null });
      }
      for (const c of chatRes.data ?? []) {
        if (c.role !== "user") continue;
        const p = profileMap[c.user_id];
        const snippet = c.content.length > 60 ? c.content.slice(0, 60) + "..." : c.content;
        activities.push({ type: "chat", description: `${p?.name ?? "Someone"} asked: "${snippet}"`, timestamp: c.created_at, user: p?.name ?? "Unknown", avatar: p?.avatar_url ?? null });
      }

      activities.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      return activities.slice(0, data.limit);
    }, []);
  });

export const getUsers = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({
    search: z.string().default(""),
    filter: z.enum(["all", "active", "inactive", "new"]).default("all"),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return { users: [], total: 0 };

    return safeQuery(async () => {
      let query = client.from("profiles").select("*", { count: "exact" });

      if (data.search) {
        query = query.or(`name.ilike.%${data.search}%,email.ilike.%${data.search}%`);
      }

      if (data.filter === "active") {
        const today = new Date().toISOString().slice(0, 10);
        const { data: activeIdsRaw } = await client.from("daily_usage").select("user_id").eq("date", today);
        const activeIdsArr = (activeIdsRaw ?? []) as any[];
        const ids = [...new Set(activeIdsArr.map((r: any) => r.user_id))];
        if (ids.length === 0) return { users: [], total: 0 };
        query = query.in("id", ids);
      } else if (data.filter === "inactive") {
        const today = new Date().toISOString().slice(0, 10);
        const { data: activeIdsRaw } = await client.from("daily_usage").select("user_id").eq("date", today);
        const activeIdsArr = (activeIdsRaw ?? []) as any[];
        const ids = new Set(activeIdsArr.map((r: any) => r.user_id));
        const { data: allProfilesRaw } = await client.from("profiles").select("id");
        const allProfilesArr = (allProfilesRaw ?? []) as any[];
        const inactiveIds = allProfilesArr.map((p: any) => p.id).filter((id: string) => !ids.has(id));
        if (inactiveIds.length === 0) return { users: [], total: 0 };
        query = query.in("id", inactiveIds);
      } else if (data.filter === "new") {
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        query = query.gte("created_at", weekAgo);
      }

      const from = (data.page - 1) * data.pageSize;
      const { data: users, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, from + data.pageSize - 1);

      if (error) return { users: [], total: 0 };
      return { users: users ?? [], total: count ?? 0 };
    }, { users: [], total: 0 });
  });

export const getUserDetail = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return emptyUserDetail();

    return safeQuery(async () => {
      const [profileRes, workoutRes, foodRes, chatRes, usageRes] = await Promise.all([
        client.from("profiles").select("*").eq("id", data.userId).single(),
        client.from("workout_sessions").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(3),
        client.from("food_logs").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(3),
        client.from("chat_messages").select("*").eq("user_id", data.userId).order("created_at", { ascending: false }).limit(10),
        client.from("daily_usage").select("*").eq("user_id", data.userId).order("date", { ascending: false }).limit(30),
      ]);

      if (profileRes.error) return emptyUserDetail();

      const { data: allSessions } = await client
        .from("workout_sessions")
        .select("id, status, rating")
        .eq("user_id", data.userId);

      const totalWorkouts = allSessions?.length ?? 0;
      const completedWorkouts = (allSessions ?? [] as any[]).filter((s: any) => s.status === "completed").length ?? 0;
      const ratings = ((allSessions ?? []) as any[]).map((s: any) => s.rating).filter(Boolean) as number[];
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

      return {
        profile: profileRes.data,
        workouts: workoutRes.data ?? [],
        meals: foodRes.data ?? [],
        recentChat: chatRes.data ?? [],
        dailyUsage: usageRes.data ?? [],
        stats: { totalWorkouts, completedWorkouts, avgRating, totalMessages: chatRes.data?.length ?? 0 },
      };
    }, emptyUserDetail());
  });

function emptyUserDetail() {
  return { profile: null, workouts: [], meals: [], recentChat: [], dailyUsage: [], stats: { totalWorkouts: 0, completedWorkouts: 0, avgRating: 0, totalMessages: 0 } };
}

export const getWorkoutStats = createServerFn({ method: "GET" }).handler(async () => {
  const client = admin();
  if (!client) return { totalSessions: 0, avgDuration: 0, mostCommonGoal: "none", completionRate: 0 };

  return safeQuery(async () => {
    const { count: totalSessions } = await client
      .from("workout_sessions")
      .select("id", { count: "exact", head: true });

    const { data: durations } = await client
      .from("workout_sessions")
      .select("duration_actual")
      .not("duration_actual", "is", null);

    const avgDuration = durations && durations.length > 0
      ? Math.round((durations as any[]).reduce((a: number, b: any) => a + (b.duration_actual ?? 0), 0) / durations.length)
      : 0;

    const { data: completed } = await client
      .from("workout_sessions")
      .select("id")
      .eq("status", "completed");

    const totalCompleted = completed?.length ?? 0;
    const completionRate = totalSessions && totalSessions > 0
      ? Math.round((totalCompleted / totalSessions) * 100)
      : 0;

    const { data: goals } = await client.from("profiles").select("goal");
    const goalCounts: Record<string, number> = {};
    for (const g of goals ?? []) {
      const key = g.goal ?? "not_set";
      goalCounts[key] = (goalCounts[key] ?? 0) + 1;
    }
    const mostCommonGoal = Object.entries(goalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

    return { totalSessions: totalSessions ?? 0, avgDuration, mostCommonGoal, completionRate };
  }, { totalSessions: 0, avgDuration: 0, mostCommonGoal: "none", completionRate: 0 });
});

export const getWorkouts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({
    goal: z.string().default("all"),
    minRating: z.number().int().min(0).max(5).default(0),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return { workouts: [], total: 0 };

    return safeQuery(async () => {
      let userIds: string[] | undefined;
      if (data.goal !== "all") {
        const { data: goalProfiles } = await client
          .from("profiles")
          .select("id")
          .eq("goal", data.goal);
        userIds = (goalProfiles ?? []).map((p: any) => p.id);
        if (userIds.length === 0) return { workouts: [], total: 0 };
      }

      let query = client
        .from("workout_sessions")
        .select("*", { count: "exact" });

      if (userIds) {
        query = query.in("user_id", userIds);
      }
      if (data.minRating > 0) {
        query = query.gte("rating", data.minRating);
      }

      const from = (data.page - 1) * data.pageSize;
      const { data: rows, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, from + data.pageSize - 1);

      if (error) return { workouts: [], total: 0 };

      const workoutUserIds = [...new Set((rows ?? []).map((r: any) => r.user_id))];
      const { data: profiles } = await client
        .from("profiles")
        .select("id, name, email, avatar_url, goal")
        .in("id", workoutUserIds);
      const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

      const workouts = (rows ?? []).map((w: any) => ({
        ...w,
        profiles: profileMap[w.user_id] ?? null,
      }));

      return { workouts, total: count ?? 0 };
    }, { workouts: [], total: 0 });
  });

export const getTopExercises = createServerFn({ method: "GET" }).handler(async () => {
  const client = admin();
  if (!client) return [];

  return safeQuery(async () => {
    const { data: sessions } = await client
      .from("workout_sessions")
      .select("plan_json")
      .limit(500);

    const exerciseCounts: Record<string, { count: number; totalDuration: number }> = {};

    for (const s of sessions ?? []) {
      const plan = s.plan_json as unknown as { segments?: { title: string; duration_seconds: number }[] };
      const segments = plan?.segments ?? [];
      for (const seg of segments) {
        const title = seg.title?.trim() ?? "Unknown";
        if (!exerciseCounts[title]) {
          exerciseCounts[title] = { count: 0, totalDuration: 0 };
        }
        exerciseCounts[title].count++;
        exerciseCounts[title].totalDuration += seg.duration_seconds ?? 0;
      }
    }

    return Object.entries(exerciseCounts)
      .map(([name, d]) => ({ name, count: d.count, totalDuration: d.totalDuration }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, []);
});

export const getNutritionSummary = createServerFn({ method: "GET" }).handler(async () => {
  const client = admin();
  if (!client) return { totalCalories: 0, avgProtein: 0, avgCarbs: 0, avgFats: 0, totalWater: 0 };

  return safeQuery(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const [foodRes, waterRes] = await Promise.all([
      client.from("food_logs").select("calories, protein_g, carbs_g, fats_g").eq("date", today),
      client.from("water_logs").select("amount_ml").eq("date", today),
    ]);

    const foods = (foodRes.data ?? []) as any[];
    const waters = (waterRes.data ?? []) as any[];

    const totalCalories = foods.reduce((a, b) => a + (b.calories ?? 0), 0);
    const totalProtein = foods.reduce((a, b) => a + (b.protein_g ?? 0), 0);
    const totalCarbs = foods.reduce((a, b) => a + (b.carbs_g ?? 0), 0);
    const totalFats = foods.reduce((a, b) => a + (b.fats_g ?? 0), 0);
    const foodCount = foods.length;
    const totalWater = waters.reduce((a, b) => a + (b.amount_ml ?? 0), 0);

    return {
      totalCalories,
      avgProtein: foodCount > 0 ? Math.round(totalProtein / foodCount) : 0,
      avgCarbs: foodCount > 0 ? Math.round(totalCarbs / foodCount) : 0,
      avgFats: foodCount > 0 ? Math.round(totalFats / foodCount) : 0,
      totalWater,
    };
  }, { totalCalories: 0, avgProtein: 0, avgCarbs: 0, avgFats: 0, totalWater: 0 });
});

export const getDailyMacros = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ days: z.number().int().min(1).max(30).default(7) }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return [];
    const startDate = new Date(Date.now() - data.days * 86400000).toISOString().slice(0, 10);

    return safeQuery(async () => {
      const { data: rows } = await client
        .from("food_logs")
        .select("date, calories, protein_g, carbs_g, fats_g")
        .gte("date", startDate)
        .order("date");

      const dayMap: Record<string, { calories: number; protein: number; carbs: number; fats: number }> = {};
      for (let i = 0; i < data.days; i++) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        dayMap[d] = { calories: 0, protein: 0, carbs: 0, fats: 0 };
      }
      for (const r of rows ?? []) {
        if (dayMap[r.date]) {
          dayMap[r.date].calories += r.calories ?? 0;
          dayMap[r.date].protein += r.protein_g ?? 0;
          dayMap[r.date].carbs += r.carbs_g ?? 0;
          dayMap[r.date].fats += r.fats_g ?? 0;
        }
      }

      return Object.entries(dayMap).map(([date, m]) => ({ date, ...m })).sort((a, b) => a.date.localeCompare(b.date));
    }, []);
  });

export const getMealLogs = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({
    search: z.string().default(""),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return { meals: [], total: 0 };

    return safeQuery(async () => {
      let query = client
        .from("food_logs")
        .select("*", { count: "exact" });

      if (data.search) {
        query = query.ilike("name", `%${data.search}%`);
      }

      const from = (data.page - 1) * data.pageSize;
      const { data: rows, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, from + data.pageSize - 1);

      if (error) return { meals: [], total: 0 };

      const mealUserIds = [...new Set((rows ?? []).map((r: any) => r.user_id))];
      const { data: profiles } = await client
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", mealUserIds);
      const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

      const meals = (rows ?? []).map((m: any) => ({
        ...m,
        profiles: profileMap[m.user_id] ?? null,
      }));

      return { meals, total: count ?? 0 };
    }, { meals: [], total: 0 });
  });

export const getChatStats = createServerFn({ method: "GET" }).handler(async () => {
  const client = admin();
  if (!client) return { totalConversations: 0, avgMessagesPerSession: 0, avgDuration: 0, commonTopics: [] };

  return safeQuery(async () => {
    const { count: totalMessages } = await client
      .from("chat_messages")
      .select("id", { count: "exact", head: true });

    const { data: messages } = await client
      .from("chat_messages")
      .select("user_id, created_at")
      .order("created_at", { ascending: true });

    const userSessions: Record<string, { first: string; last: string; count: number }> = {};
    for (const m of messages ?? []) {
      if (!userSessions[m.user_id]) {
        userSessions[m.user_id] = { first: m.created_at, last: m.created_at, count: 0 };
      }
      userSessions[m.user_id].last = m.created_at;
      userSessions[m.user_id].count++;
    }

    const sessionCounts = Object.values(userSessions);
    const totalConversations = sessionCounts.length;
    const avgMessagesPerSession = totalConversations > 0 ? Math.round((totalMessages ?? 0) / totalConversations) : 0;

    const durations = sessionCounts
      .map((s) => (new Date(s.last).getTime() - new Date(s.first).getTime()) / 60000)
      .filter((d) => d > 0);
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

    const { data: chatMessages } = await client
      .from("chat_messages")
      .select("content")
      .eq("role", "user")
      .limit(500);

    const wordCounts: Record<string, number> = {};
    const topicKeywords = ["nutrition", "workout", "weight", "diet", "exercise", "sleep", "recovery", "motivation", "protein", "cardio", "strength", "flexibility"];
    for (const m of chatMessages ?? []) {
      const lower = m.content.toLowerCase();
      for (const kw of topicKeywords) {
        if (lower.includes(kw)) wordCounts[kw] = (wordCounts[kw] ?? 0) + 1;
      }
    }

    const commonTopics = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));

    return { totalConversations, avgMessagesPerSession, avgDuration, commonTopics };
  }, { totalConversations: 0, avgMessagesPerSession: 0, avgDuration: 0, commonTopics: [] });
});

export const getChatLogs = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({
    search: z.string().default(""),
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
  }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return { conversations: [], total: 0 };

    return safeQuery(async () => {
      const { data: messages, count } = await client
        .from("chat_messages")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(0, 2000);

      if (!messages) return { conversations: [], total: 0 };

      const allUserIds = [...new Set(messages.map((m: any) => m.user_id))];
      const { data: profiles } = await client
        .from("profiles")
        .select("id, name, email, avatar_url")
        .in("id", allUserIds);
      const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

      const userGroups: Record<string, any> = {};
      for (const m of messages) {
        const uid = m.user_id;
        if (!userGroups[uid]) {
          const p = profileMap[uid] ?? {};
          userGroups[uid] = {
            user: { id: uid, name: p.name ?? "Unknown", email: p.email ?? "", avatar_url: p.avatar_url ?? null },
            messages: [],
            first: m.created_at,
            last: m.created_at,
          };
        }
        userGroups[uid].messages.push(m);
        if (m.created_at < userGroups[uid].first) userGroups[uid].first = m.created_at;
        if (m.created_at > userGroups[uid].last) userGroups[uid].last = m.created_at;
      }

      let conversations = Object.values(userGroups)
        .map((g) => ({
          userId: g.user.id,
          userName: g.user.name,
          userEmail: g.user.email,
          userAvatar: g.user.avatar_url,
          messageCount: g.messages.length,
          firstMessage: g.first,
          lastMessage: g.last,
        }))
        .sort((a: any, b: any) => b.lastMessage.localeCompare(a.lastMessage));

      if (data.search) {
        const s = data.search.toLowerCase();
        conversations = conversations.filter((c: any) => c.userName.toLowerCase().includes(s) || c.userEmail.toLowerCase().includes(s));
      }

      const total = conversations.length;
      const from = (data.page - 1) * data.pageSize;
      const paged = conversations.slice(from, from + data.pageSize);

      return { conversations: paged, total };
    }, { conversations: [], total: 0 });
  });

export const getConversationMessages = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return [];

    return safeQuery(async () => {
      const { data: messages } = await client
        .from("chat_messages")
        .select("*")
        .eq("user_id", data.userId)
        .order("created_at", { ascending: true })
        .limit(100);

      return messages ?? [];
    }, []);
  });

export const getAdminStatus = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ email: z.string().email() }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return { isAdmin: false, role: "" };

    if (data.email === "admin@admin.co") {
      try {
        const { data: profile } = await client
          .from("profiles")
          .select("role")
          .eq("email", data.email)
          .maybeSingle();
        if (profile && profile.role !== "admin") {
          await client.from("profiles").update({ role: "admin" }).eq("email", data.email);
        }
      } catch {
        // role column doesn't exist yet — still allow access by email
      }
      return { isAdmin: true, role: "admin" };
    }

    try {
      const { data: profile } = await client
        .from("profiles")
        .select("role")
        .eq("email", data.email)
        .maybeSingle();
      return { isAdmin: profile?.role === "admin", role: profile?.role ?? "user" };
    } catch {
      return { isAdmin: false, role: "user" };
    }
  });

export const seedAdminUser = createServerFn({ method: "POST" }).handler(async () => {
  const client = admin();
  if (!client) return { ok: false, error: "No DB client" };

  try {
    const { data: existing } = await client
      .from("profiles")
      .select("id")
      .eq("email", "admin@admin.co")
      .maybeSingle();

    if (existing) {
      await client.from("profiles").update({ role: "admin" }).eq("id", existing.id);
      return { ok: true, message: "Admin user already exists, role updated." };
    }

    const { data: authUser, error: createErr } = await client.auth.admin.createUser({
      email: "admin@admin.co",
      password: "admin123",
      email_confirm: true,
    });

    if (createErr) return { ok: false, error: createErr.message };
    if (!authUser?.user) return { ok: false, error: "Failed to create user" };

    const { error: profileErr } = await client.from("profiles").upsert({
      id: authUser.user.id,
      email: "admin@admin.co",
      name: "Admin",
      role: "admin",
    }).eq("id", authUser.user.id);

    if (profileErr) return { ok: false, error: profileErr.message };
    return { ok: true, message: "Admin user created successfully." };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Unknown error" };
  }
});

export const searchUsersByEmail = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ query: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return [];

    return safeQuery(async () => {
      const { data: users } = await client
        .from("profiles")
        .select("id, email, name, role")
        .ilike("email", `%${data.query}%`)
        .limit(20);

      return users ?? [];
    }, []);
  });

export const setUserRole = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({
    userId: z.string().uuid(),
    role: z.enum(["user", "admin"]),
  }).parse(d))
  .handler(async ({ data }) => {
    const client = admin();
    if (!client) return { ok: false, error: "No DB client" };

    return safeQuery(async () => {
      const { error } = await client
        .from("profiles")
        .update({ role: data.role })
        .eq("id", data.userId);

      if (error) return { ok: false, error: error.message };
      return { ok: true, message: `Role updated to "${data.role}".` };
    }, { ok: false, error: "Failed to update role" });
  });
