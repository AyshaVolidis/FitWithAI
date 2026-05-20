import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const FoodInput = z.object({
  name: z.string().trim().min(1).max(120),
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.number().int().min(0).max(5000),
  protein_g: z.number().min(0).max(500),
  carbs_g: z.number().min(0).max(1000),
  fats_g: z.number().min(0).max(500),
  date: z.string().optional(),
});

export const logFood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FoodInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const date = data.date ?? new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("food_logs").insert({
      user_id: userId,
      date,
      meal_type: data.meal_type,
      name: data.name,
      calories: data.calories,
      protein_g: data.protein_g,
      carbs_g: data.carbs_g,
      fats_g: data.fats_g,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFoodLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("food_logs").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logWater = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ amount_ml: z.number().int().min(50).max(3000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const date = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("water_logs").insert({ user_id: userId, date, amount_ml: data.amount_ml });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logWeight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ weight_kg: z.number().min(20).max(400) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const date = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from("weight_logs").insert({ user_id: userId, date, weight_kg: data.weight_kg });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Estimate daily macro targets via simple Mifflin-St Jeor + goal modifier (no AI call needed for basics). */
export const computeMacroTargets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    weight_kg: z.number().min(30).max(300),
    height_cm: z.number().min(120).max(230),
    age: z.number().int().min(13).max(100),
    sex: z.enum(["male", "female"]),
    activity_level: z.enum(["sedentary", "light", "moderate", "active"]).default("moderate"),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase.from("profiles").select("goal").eq("id", userId).single();

    // Mifflin-St Jeor BMR
    const bmr = data.sex === "male"
      ? 10 * data.weight_kg + 6.25 * data.height_cm - 5 * data.age + 5
      : 10 * data.weight_kg + 6.25 * data.height_cm - 5 * data.age - 161;
    const activity = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }[data.activity_level];
    let tdee = Math.round(bmr * activity);

    const goal = profile?.goal ?? "general_fitness";
    if (goal === "lose_weight") tdee -= 400;
    else if (goal === "build_muscle") tdee += 300;

    const protein_g = Math.round(data.weight_kg * (goal === "build_muscle" ? 2.0 : 1.6));
    const fats_g = Math.round((tdee * 0.25) / 9);
    const carbs_g = Math.max(50, Math.round((tdee - protein_g * 4 - fats_g * 9) / 4));

    const { error } = await supabase.from("profiles").update({
      daily_calorie_target: tdee,
      protein_target_g: protein_g,
      carbs_target_g: carbs_g,
      fats_target_g: fats_g,
    }).eq("id", userId);
    if (error) throw new Error(error.message);

    return { calories: tdee, protein_g, carbs_g, fats_g };
  });
