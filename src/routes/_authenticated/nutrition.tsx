import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { logFood, deleteFoodLog, logWater } from "@/lib/nutrition.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Apple, Droplet, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CalorieRing } from "@/components/CalorieRing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/nutrition")({
  head: () => ({ meta: [{ title: "Nutrition — FitAI" }] }),
  component: Nutrition,
});

type FoodLog = { id: string; name: string; meal_type: "breakfast" | "lunch" | "dinner" | "snack"; calories: number; protein_g: number; carbs_g: number; fats_g: number };

const MEALS = [
  { v: "breakfast" as const, label: "Breakfast", emoji: "🌅" },
  { v: "lunch" as const, label: "Lunch", emoji: "🥗" },
  { v: "dinner" as const, label: "Dinner", emoji: "🍽️" },
  { v: "snack" as const, label: "Snack", emoji: "🍎" },
];

function Nutrition() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [waterMl, setWaterMl] = useState(0);
  const [targets, setTargets] = useState({ calories: 2000, protein: 140, carbs: 200, fats: 65 });
  const [open, setOpen] = useState(false);

  const logFoodFn = useServerFn(logFood);
  const deleteFn = useServerFn(deleteFoodLog);
  const logWaterFn = useServerFn(logWater);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    const [foodRes, waterRes, profRes] = await Promise.all([
      supabase.from("food_logs").select("*").eq("user_id", user.id).eq("date", today).order("created_at"),
      supabase.from("water_logs").select("amount_ml").eq("user_id", user.id).eq("date", today),
      supabase.from("profiles").select("daily_calorie_target, protein_target_g, carbs_target_g, fats_target_g").eq("id", user.id).single(),
    ]);
    setLogs((foodRes.data ?? []) as FoodLog[]);
    setWaterMl((waterRes.data ?? []).reduce((s, w) => s + (w.amount_ml ?? 0), 0));
    if (profRes.data) {
      setTargets({
        calories: profRes.data.daily_calorie_target ?? 2000,
        protein: profRes.data.protein_target_g ?? 140,
        carbs: profRes.data.carbs_target_g ?? 200,
        fats: profRes.data.fats_target_g ?? 65,
      });
    }
  };

  useEffect(() => { load(); }, []);

  const totals = logs.reduce((acc, l) => ({
    calories: acc.calories + l.calories,
    protein: acc.protein + Number(l.protein_g),
    carbs: acc.carbs + Number(l.carbs_g),
    fats: acc.fats + Number(l.fats_g),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const handleAdd = async (food: Omit<FoodLog, "id">) => {
    try {
      await logFoodFn({ data: food });
      toast.success("Logged");
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFn({ data: { id } });
      await load();
    } catch { toast.error("Failed to delete"); }
  };

  const addWater = async (ml: number) => {
    setWaterMl((w) => w + ml);
    try { await logWaterFn({ data: { amount_ml: ml } }); }
    catch { toast.error("Couldn't log water"); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>Nutrition</h1>
          <p className="text-sm text-muted-foreground">Track your fuel for today</p>
        </div>
         <Dialog open={open} onOpenChange={setOpen}>
           <DialogTrigger asChild>
             <Button className="bg-gradient-neon text-primary-foreground hover:opacity-90 transition-all hover-lift">
               <Plus className="mr-2 h-4 w-4" /> Log food
             </Button>
           </DialogTrigger>
           <DialogContent className="glass-strong border border-white/20">
             <DialogHeader><DialogTitle>Log a meal</DialogTitle></DialogHeader>
             <FoodForm onSubmit={handleAdd} />
           </DialogContent>
         </Dialog>
      </div>

       {/* Top ring + macros */}
       <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid gap-4 md:grid-cols-2">
         <div className="glass-strong rounded-2xl p-6 border border-white/20 border-glow transition-all hover-lift">
           <div className="text-xs uppercase tracking-wider text-muted-foreground">Today's calories</div>
           <div className="mt-3 flex justify-center">
             <CalorieRing value={totals.calories} target={targets.calories} size={180} />
           </div>
           <div className="mt-3 text-center text-sm text-muted-foreground">
             {targets.calories - totals.calories > 0
               ? `${targets.calories - totals.calories} kcal remaining`
               : `${totals.calories - targets.calories} kcal over`}
           </div>
         </div>
         <div className="glass-strong rounded-2xl p-6 border border-white/20 border-glow transition-all hover-lift">
           <div className="text-xs uppercase tracking-wider text-muted-foreground">Macros</div>
          <div className="mt-4 space-y-4">
            <MacroBar label="Protein" value={Math.round(totals.protein)} target={targets.protein} unit="g" color="from-primary to-accent" />
            <MacroBar label="Carbs" value={Math.round(totals.carbs)} target={targets.carbs} unit="g" color="from-accent to-primary" />
            <MacroBar label="Fats" value={Math.round(totals.fats)} target={targets.fats} unit="g" color="from-primary/70 to-accent/70" />
          </div>
        </div>
      </motion.div>

       {/* Water */}
       <div className="mt-4 glass-strong rounded-2xl p-6 border border-white/20 border-glow transition-all hover-lift">
         <div className="flex items-center justify-between">
           <div>
             <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
               <Droplet className="h-3.5 w-3.5 text-accent" /> Water
             </div>
             <div className="mt-1 text-2xl font-bold">{(waterMl / 1000).toFixed(1)}L <span className="text-sm font-normal text-muted-foreground">/ 2.5L</span></div>
           </div>
           <div className="flex gap-2">
             {[250, 500, 750].map((ml) => (
               <button key={ml} onClick={() => addWater(ml)} className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition-all hover-lift">
                 +{ml}ml
               </button>
             ))}
           </div>
         </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
          <motion.div
            key={waterMl}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (waterMl / 2500) * 100)}%` }}
            className="h-full bg-gradient-to-r from-accent to-primary"
          />
        </div>
      </div>

       {/* Meal sections */}
       <div className="mt-6 space-y-4">
         {MEALS.map((m) => {
           const items = logs.filter((l) => l.meal_type === m.v);
           const subTotal = items.reduce((s, l) => s + l.calories, 0);
           return (
             <div key={m.v} className="glass-strong rounded-2xl p-5 border border-white/20 border-glow transition-all hover-lift">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <span className="text-xl">{m.emoji}</span>
                   <span className="font-semibold">{m.label}</span>
                 </div>
                 <span className="text-sm text-muted-foreground">{subTotal} kcal</span>
               </div>
               {items.length === 0 ? (
                 <p className="mt-3 text-sm text-muted-foreground">Nothing logged yet.</p>
               ) : (
                 <div className="mt-3 space-y-2">
                   {items.map((l) => (
                     <div key={l.id} className="flex items-center justify-between rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm transition-all">
                       <div className="min-w-0 flex-1">
                         <div className="truncate font-medium">{l.name}</div>
                         <div className="text-xs text-muted-foreground">
                           {l.calories} kcal · {Math.round(Number(l.protein_g))}P · {Math.round(Number(l.carbs_g))}C · {Math.round(Number(l.fats_g))}F
                         </div>
                       </div>
                       <button onClick={() => handleDelete(l.id)} className="ml-3 rounded-md p-1.5 text-muted-foreground hover:bg-white/10 hover:text-destructive transition-all">
                         <Trash2 className="h-3.5 w-3.5" />
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           );
         })}
       </div>
    </div>
  );
}

function MacroBar({ label, value, target, unit, color }: { label: string; value: number; target: number; unit: string; color: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value} / {target}{unit}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          key={value}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
          className={cn("h-full rounded-full bg-gradient-to-r", color)}
        />
      </div>
    </div>
  );
}

function FoodForm({ onSubmit }: { onSubmit: (food: { name: string; meal_type: "breakfast" | "lunch" | "dinner" | "snack"; calories: number; protein_g: number; carbs_g: number; fats_g: number }) => void | Promise<void> }) {
  const [name, setName] = useState("");
  const [meal, setMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">("snack");
  const [cal, setCal] = useState("");
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const [f, setF] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !cal) return;
        onSubmit({
          name: name.trim(),
          meal_type: meal,
          calories: parseInt(cal) || 0,
          protein_g: parseFloat(p) || 0,
          carbs_g: parseFloat(c) || 0,
          fats_g: parseFloat(f) || 0,
        });
      }}
      className="space-y-3"
    >
      <div>
        <Label>Food name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken & rice" required />
      </div>
       <div>
         <Label>Meal</Label>
         <div className="mt-1 grid grid-cols-4 gap-2">
           {MEALS.map((m) => (
             <button key={m.v} type="button" onClick={() => setMeal(m.v)}
               className={cn("rounded-lg border px-2 py-2 text-xs transition-all hover-lift", meal === m.v ? "border-primary bg-primary/10 text-primary" : "border-white/20 bg-white/5")}>
               {m.emoji} {m.label}
             </button>
           ))}
         </div>
       </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Calories</Label><Input type="number" value={cal} onChange={(e) => setCal(e.target.value)} placeholder="0" min="0" required /></div>
        <div><Label>Protein (g)</Label><Input type="number" value={p} onChange={(e) => setP(e.target.value)} placeholder="0" min="0" /></div>
        <div><Label>Carbs (g)</Label><Input type="number" value={c} onChange={(e) => setC(e.target.value)} placeholder="0" min="0" /></div>
        <div><Label>Fats (g)</Label><Input type="number" value={f} onChange={(e) => setF(e.target.value)} placeholder="0" min="0" /></div>
      </div>
       <Button type="submit" className="w-full bg-gradient-neon text-primary-foreground hover:opacity-90 transition-all"><Apple className="mr-2 h-4 w-4" /> Log it</Button>
    </form>
  );
}
