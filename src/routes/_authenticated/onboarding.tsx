import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

const GOALS = [
  { v: "lose_weight", label: "Lose weight", emoji: "🔥" },
  { v: "build_muscle", label: "Build muscle", emoji: "💪" },
  { v: "improve_endurance", label: "Improve endurance", emoji: "🏃" },
  { v: "general_fitness", label: "General fitness", emoji: "⚡" },
  { v: "flexibility", label: "Flexibility & mobility", emoji: "🧘" },
] as const;

const LEVELS = [
  { v: "beginner", label: "Beginner", desc: "New or returning to fitness" },
  { v: "intermediate", label: "Intermediate", desc: "Train regularly" },
  { v: "advanced", label: "Advanced", desc: "Train consistently and intensely" },
] as const;

const EQUIPMENT = ["none", "dumbbells", "yoga_mat", "resistance_bands", "kettlebell", "pull_up_bar"] as const;

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [equipment, setEquipment] = useState<string[]>(["none"]);
  const [duration, setDuration] = useState(30);
  const [frequency, setFrequency] = useState(3);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("name, onboarded_at").eq("id", user.id).maybeSingle();
      if (data?.onboarded_at) navigate({ to: "/dashboard" });
      if (data?.name) setName(data.name);
    })();
  }, [navigate]);

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      name,
      goal: goal as "lose_weight" | "build_muscle" | "improve_endurance" | "general_fitness" | "flexibility",
      fitness_level: level as "beginner" | "intermediate" | "advanced",
      equipment,
      duration_preference: duration,
      weekly_frequency: frequency,
      onboarded_at: new Date().toISOString(),
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("You're all set!");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <div className="mb-6 flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= step ? "bg-gradient-neon" : "bg-white/5")} />
        ))}
      </div>

       <AnimatePresence mode="wait">
         <motion.div
           key={step}
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           exit={{ opacity: 0, x: -20 }}
           transition={{ duration: 0.25 }}
           className="glass-strong rounded-2xl p-6 border border-white/20 border-glow transition-all"
         >
          {step === 0 && (
            <>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>What's your goal?</h2>
              <p className="mt-1 text-sm text-muted-foreground">We'll tailor every session to it.</p>
              <div className="mt-5 space-y-2">
                {GOALS.map((g) => (
                   <button
                     key={g.v}
                     onClick={() => setGoal(g.v)}
                     className={cn(
                       "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all hover-lift",
                       goal === g.v ? "border-primary bg-primary/10 glow-neon" : "border-white/20 bg-white/5 hover:bg-white/10"
                     )}
                   >
                    <span className="text-xl">{g.emoji}</span>
                    {g.label}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>What's your level?</h2>
              <div className="mt-5 space-y-2">
                {LEVELS.map((l) => (
                   <button
                     key={l.v}
                     onClick={() => setLevel(l.v)}
                     className={cn(
                       "w-full rounded-xl border px-4 py-3 text-left transition-all hover-lift",
                       level === l.v ? "border-primary bg-primary/10 glow-neon" : "border-white/20 bg-white/5 hover:bg-white/10"
                     )}
                   >
                    <div className="font-medium">{l.label}</div>
                    <div className="text-xs text-muted-foreground">{l.desc}</div>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>What equipment do you have?</h2>
              <p className="mt-1 text-sm text-muted-foreground">Pick all that apply.</p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                {EQUIPMENT.map((e) => {
                  const checked = equipment.includes(e);
                  return (
                       <button
                         key={e}
                         onClick={() => setEquipment((cur) => (checked ? cur.filter((x) => x !== e) : [...cur, e]))}
                         className={cn(
                           "flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm capitalize transition-all hover-lift",
                           checked ? "border-primary bg-primary/10 glow-neon" : "border-white/20 bg-white/5 hover:bg-white/10"
                         )}
                       >
                      <Checkbox checked={checked} />
                      {e.replace("_", " ")}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>How long should sessions be?</h2>
              <div className="mt-5 space-y-4">
                <div>
                  <Label>Duration: <span className="text-primary">{duration} minutes</span></Label>
                  <input type="range" min={10} max={60} step={5} value={duration} onChange={(e) => setDuration(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" />
                </div>
                <div>
                  <Label>Days per week: <span className="text-primary">{frequency}</span></Label>
                  <input type="range" min={1} max={7} step={1} value={frequency} onChange={(e) => setFrequency(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" />
                </div>
              </div>
            </>
          )}
           {step === 4 && (
             <>
               <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>What should we call you?</h2>
               <Input className="mt-5 bg-white/5 border-white/20" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
             </>
           )}

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0}>Back</Button>
             {step < 4 ? (
               <Button
                 onClick={next}
                 disabled={(step === 0 && !goal) || (step === 1 && !level) || (step === 2 && equipment.length === 0)}
                 className="bg-gradient-neon text-primary-foreground hover:opacity-90 transition-all hover-lift"
               >
                 Continue
               </Button>
             ) : (
               <Button onClick={finish} disabled={!name || saving} className="bg-gradient-neon text-primary-foreground hover:opacity-90 transition-all hover-lift">
                 {saving ? "Saving…" : "Finish"}
               </Button>
             )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
