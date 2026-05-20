import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { computeMacroTargets } from "@/lib/nutrition.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Calculator } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — FitAI" }] }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [frequency, setFrequency] = useState(3);
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);
  const [proteinTarget, setProteinTarget] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Macro calculator
  const [calcOpen, setCalcOpen] = useState(false);
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const computeFn = useServerFn(computeMacroTargets);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from("profiles").select("name, duration_preference, weekly_frequency, daily_calorie_target, protein_target_g").eq("id", user.id).single();
    if (prof) {
      setName(prof.name ?? "");
      setDuration(prof.duration_preference ?? 30);
      setFrequency(prof.weekly_frequency ?? 3);
      setCalorieTarget(prof.daily_calorie_target);
      setProteinTarget(prof.protein_target_g);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ name, duration_preference: duration, weekly_frequency: frequency }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const compute = async () => {
    const w = parseFloat(weightKg), h = parseFloat(heightCm), a = parseInt(age);
    if (!w || !h || !a) return toast.error("Fill weight, height, age");
    try {
      const res = await computeFn({ data: { weight_kg: w, height_cm: h, age: a, sex } });
      toast.success(`Targets set: ${res.calories} kcal, ${res.protein_g}g protein`);
      setCalcOpen(false);
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const signOut = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  return (
    <div className="mx-auto max-w-xl px-4 py-6 md:py-8">
      <h1 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>Settings</h1>

       <div className="mt-6 glass-strong rounded-2xl p-5 border border-white/20 border-glow transition-all hover-lift">
         <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Profile</h2>
         <div className="mt-4 space-y-4">
           <div>
             <Label htmlFor="name">Name</Label>
             <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 bg-white/5 border-white/20" />
           </div>
           <div>
             <Label>Session length: {duration} min</Label>
             <input type="range" min={10} max={60} step={5} value={duration} onChange={(e) => setDuration(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" />
           </div>
           <div>
             <Label>Weekly frequency: {frequency} days</Label>
             <input type="range" min={1} max={7} step={1} value={frequency} onChange={(e) => setFrequency(+e.target.value)} className="mt-2 w-full accent-[var(--primary)]" />
           </div>
           <Button onClick={save} disabled={saving} className="bg-gradient-neon text-primary-foreground hover:opacity-90 transition-all">{saving ? "Saving…" : "Save"}</Button>
         </div>
       </div>

       <div className="mt-4 glass-strong rounded-2xl p-5 border border-white/20 border-glow transition-all hover-lift">
         <div className="flex items-start justify-between">
           <div>
             <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nutrition targets</h2>
             <div className="mt-2 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
               {calorieTarget ?? "—"} <span className="text-sm font-normal text-muted-foreground">kcal/day</span>
             </div>
             <div className="text-xs text-muted-foreground">{proteinTarget ?? "—"} g protein</div>
           </div>
           <Button size="sm" variant="outline" className="border-white/20" onClick={() => setCalcOpen((o) => !o)}>
             <Calculator className="mr-1.5 h-3.5 w-3.5" /> {calcOpen ? "Cancel" : "Calculate"}
           </Button>
         </div>
         {calcOpen && (
           <div className="mt-4 space-y-3 border-t border-white/20 pt-4">
             <div className="grid grid-cols-3 gap-3">
               <div><Label>Weight (kg)</Label><Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="mt-1.5 bg-white/5 border-white/20" /></div>
               <div><Label>Height (cm)</Label><Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} className="mt-1.5 bg-white/5 border-white/20" /></div>
               <div><Label>Age</Label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1.5 bg-white/5 border-white/20" /></div>
             </div>
             <div className="flex gap-2">
               {(["male", "female"] as const).map((s) => (
                 <button key={s} type="button" onClick={() => setSex(s)}
                   className={"flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-all hover-lift " + (sex === s ? "border-primary bg-primary/10 text-primary" : "border-white/20 bg-white/5")}>
                   {s}
                 </button>
               ))}
             </div>
             <Button onClick={compute} className="w-full bg-gradient-neon text-primary-foreground hover:opacity-90 transition-all">
               <Sparkles className="mr-2 h-4 w-4" /> Calculate targets
             </Button>
           </div>
         )}
       </div>

       <Button variant="outline" onClick={signOut} className="mt-6 w-full border-white/20 hover:bg-white/10 transition-all">Sign out</Button>
    </div>
  );
}
