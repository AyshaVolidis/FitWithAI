import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { buildAndSaveInsight } from "@/lib/insights.functions";

export const Route = createFileRoute("/api/public/hooks/generate-weekly-insights")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey") ?? request.headers.get("authorization")?.replace("Bearer ", "");
        if (!apiKey || apiKey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

        // Find all users with any activity in the past 7 days
        const [w, f, s] = await Promise.all([
          supabaseAdmin.from("workout_sessions").select("user_id").gte("date", since),
          supabaseAdmin.from("food_logs").select("user_id").gte("date", since),
          supabaseAdmin.from("weight_logs").select("user_id").gte("date", since),
        ]);
        const userIds = Array.from(new Set([
          ...(w.data ?? []).map((r) => r.user_id),
          ...(f.data ?? []).map((r) => r.user_id),
          ...(s.data ?? []).map((r) => r.user_id),
        ]));

        const results: { userId: string; ok: boolean; error?: string }[] = [];
        for (const uid of userIds) {
          try {
            await buildAndSaveInsight(supabaseAdmin, uid);
            results.push({ userId: uid, ok: true });
          } catch (e) {
            results.push({ userId: uid, ok: false, error: e instanceof Error ? e.message : String(e) });
            console.error(`[weekly-insights] ${uid} failed:`, e);
          }
          await new Promise((r) => setTimeout(r, 500));
        }

        return Response.json({ processed: results.length, failed: results.filter((r) => !r.ok).length });
      },
    },
  },
});
