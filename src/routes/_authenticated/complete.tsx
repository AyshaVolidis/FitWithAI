import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Star, Trophy } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/complete")({
  validateSearch: z.object({ id: z.string() }),
  head: () => ({ meta: [{ title: "Workout complete — FitAI" }] }),
  component: Complete,
});

function Complete() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const [rating, setRating] = useState(0);
  const [difficulty, setDifficulty] = useState<"too_easy" | "just_right" | "too_hard" | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!rating || !difficulty) return toast.error("Please rate and pick difficulty");
    setSaving(true);
    const { error } = await supabase.from("workout_sessions").update({ rating, difficulty_rating: difficulty }).eq("id", id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Great work! 🎉");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
       <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", duration: 0.6 }}>
         <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-neon glow-neon">
           <Trophy className="h-10 w-10 text-primary-foreground" />
         </div>
       </motion.div>
      <h1 className="mt-4 text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Workout complete!</h1>
      <p className="mt-2 text-muted-foreground">How was it?</p>

      <div className="mt-8 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
            <Star className={cn("h-10 w-10 transition-colors", s <= rating ? "fill-primary text-primary" : "text-white/15")} />
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {([
          { v: "too_easy", label: "Too easy" },
          { v: "just_right", label: "Just right" },
          { v: "too_hard", label: "Too hard" },
        ] as const).map((d) => (
           <button
             key={d.v}
             onClick={() => setDifficulty(d.v)}
             className={cn(
               "rounded-xl border px-3 py-3 text-sm transition-all hover-lift",
               difficulty === d.v ? "border-primary bg-primary/10 glow-neon" : "border-white/20 bg-white/5 hover:bg-white/10"
             )}
           >
            {d.label}
          </button>
        ))}
      </div>

       <Button onClick={submit} className="mt-8 w-full bg-gradient-neon text-primary-foreground hover:opacity-90 transition-all hover-lift" size="lg" disabled={saving}>
         {saving ? "Saving…" : "Finish"}
       </Button>
    </div>
  );
}
