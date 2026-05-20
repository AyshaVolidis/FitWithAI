import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getAiConfig } from "@/lib/ai";


export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const auth = request.headers.get("authorization");
        if (!auth?.startsWith("Bearer ")) return new Response("Unauthorized", { status: 401 });
        const token = auth.slice(7);

        const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claims } = await supabase.auth.getClaims(token);
        const userId = claims?.claims?.sub;
        if (!userId) return new Response("Unauthorized", { status: 401 });

        // Pull richer context
        const today = new Date().toISOString().slice(0, 10);
        const [profileRes, foodRes, sessionRes, weightRes] = await Promise.all([
          supabase.from("profiles").select("name, goal, fitness_level, equipment, duration_preference, daily_calorie_target, protein_target_g").eq("id", userId).single(),
          supabase.from("food_logs").select("name, calories, protein_g").eq("user_id", userId).eq("date", today),
          supabase.from("workout_sessions").select("date, status, rating").eq("user_id", userId).order("date", { ascending: false }).limit(3),
          supabase.from("weight_logs").select("weight_kg, date").eq("user_id", userId).order("date", { ascending: false }).limit(2),
        ]);

        const profile = profileRes.data;
        const todayCals = (foodRes.data ?? []).reduce((s, f) => s + (f.calories ?? 0), 0);
        const todayProtein = (foodRes.data ?? []).reduce((s, f) => s + Number(f.protein_g ?? 0), 0);
        const recentSessions = (sessionRes.data ?? []).map((s) => `${s.date}:${s.status}${s.rating ? `(${s.rating}★)` : ""}`).join(", ");
        const weightTrend = (weightRes.data ?? []).map((w) => `${w.date}=${w.weight_kg}kg`).join(", ");

        const body = await request.json() as { messages: { role: "user" | "assistant"; content: string }[] };

        const sys = `You are FitAI, a friendly, knowledgeable AI fitness and nutrition coach. Be concise (under 150 words usually), specific, practical, and motivating. Use markdown for lists.

User profile:
- Name: ${profile?.name ?? "user"}
- Goal: ${profile?.goal ?? "—"}
- Level: ${profile?.fitness_level ?? "—"}
- Equipment: ${(profile?.equipment ?? []).join(", ") || "none"}
- Preferred duration: ${profile?.duration_preference ?? 30} min
- Daily targets: ${profile?.daily_calorie_target ?? "?"} kcal, ${profile?.protein_target_g ?? "?"} g protein

Today so far:
- ${todayCals} kcal logged, ${Math.round(todayProtein)} g protein
- Recent sessions: ${recentSessions || "none"}
- Weight: ${weightTrend || "not logged"}

Avoid medical claims. If asked about injuries, suggest consulting a professional.`;

        let aiConfig;
        try {
          aiConfig = getAiConfig();
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message }), { status: 400 });
        }

        const aiResp = await fetch(aiConfig.url, {
          method: "POST",
          headers: aiConfig.headers,
          body: JSON.stringify({
            model: aiConfig.model,
            messages: [{ role: "system", content: sys }, ...body.messages],
            stream: true,
          }),
        });


        if (!aiResp.ok) {
          if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again in a moment." }), { status: 429 });
          return new Response("AI generation failed", { status: 500 });
        }

        return new Response(aiResp.body, { headers: { "Content-Type": "text/event-stream" } });
      },
    },
  },
});
