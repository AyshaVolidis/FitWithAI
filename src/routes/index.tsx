import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Apple, MessageSquare, ArrowRight, Flame, Heart, Zap, Trophy,
  Dumbbell, Salad, Smile, Star, PlayCircle, Check,
} from "lucide-react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FitAI — Your bright, friendly AI fitness coach" },
      { name: "description", content: "Daily AI workouts, nutrition tracking, and a coach in your pocket. Bright, playful, and totally free." },
      { property: "og:title", content: "FitAI — Your bright, friendly AI fitness coach" },
      { property: "og:description", content: "Daily AI workouts, nutrition tracking, and a coach in your pocket. Bright, playful, and totally free." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user) return;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.role === "admin") {
          navigate({ to: "/admin/overview" });
        } else {
          navigate({ to: "/dashboard" });
        }
      })
      .catch(() => navigate({ to: "/dashboard" }));
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Animated futuristic background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-gradient-neon opacity-40 blur-3xl animate-blob" />
        <div className="absolute top-40 -right-32 h-[460px] w-[460px] rounded-full bg-gradient-cyan opacity-35 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-gradient-success opacity-25 blur-3xl animate-blob" style={{ animationDelay: "-12s" }} />
      </div>

      <header className="container mx-auto flex items-center justify-between px-4 py-6 relative z-10">
        <Logo />
        <div className="flex gap-2">
          <Link to="/login"><Button variant="ghost" size="sm" className="rounded-full">Log in</Button></Link>
          <Link to="/signup">
            <Button size="sm" variant="gradient" className="rounded-full">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative">
        {/* HERO */}
        <section className="container mx-auto px-4 pt-8 pb-20 md:pt-16">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* Left: copy */}
            <div className="relative">
               <motion.div
                 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5 }}
                 className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-medium text-foreground"
               >
                 <span className="relative flex h-2 w-2">
                   <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                   <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                 </span>
                 Free forever · No credit card
               </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="mt-5 text-5xl font-black leading-[1.02] tracking-tight md:text-7xl"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                Get fit,{" "}
                <span className="relative inline-block">
                  <span className="scribble-underline">happily</span>
                </span>
                <br />
                with a coach{" "}
                <span className="text-gradient-neon">that gets you.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-5 max-w-lg text-lg text-muted-foreground"
              >
                Daily AI workouts, calorie & water tracking, real YouTube videos and a chatty coach —
                wrapped in a bright, friendly app that makes showing up the fun part.
              </motion.p>

               <motion.div
                 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.15 }}
                 className="mt-7 flex flex-wrap items-center gap-3"
               >
                 <Link to="/signup">
                   <Button size="lg" variant="gradient" className="group rounded-full">
                     Start your first workout
                     <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                   </Button>
                 </Link>
                 <Link to="/login">
                   <Button size="lg" variant="outline" className="rounded-full">
                     <PlayCircle className="mr-2 h-4 w-4" /> Watch tour
                   </Button>
                 </Link>
               </motion.div>

               <motion.div
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                 transition={{ duration: 0.6, delay: 0.3 }}
                 className="mt-8 flex items-center gap-4"
               >
                 <div className="flex -space-x-2">
                   {["bg-gradient-neon", "bg-gradient-cyan", "bg-gradient-success", "bg-gradient-fire"].map((g, i) => (
                     <div key={i} className={`h-8 w-8 rounded-full border-2 border-background ${g}`} />
                   ))}
                 </div>
                 <div className="text-sm">
                   <div className="flex items-center gap-1 text-warning">
                     {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                   </div>
                   <div className="text-muted-foreground">Loved by <span className="font-semibold text-foreground">12,400+</span> happy movers</div>
                 </div>
               </motion.div>
            </div>

            {/* Right: phone mockup with floating cards */}
            <div className="relative mx-auto h-[560px] w-full max-w-sm">
               <motion.div
                 initial={{ opacity: 0, y: 30, rotate: -4 }}
                 animate={{ opacity: 1, y: 0, rotate: -3 }}
                 transition={{ duration: 0.8, type: "spring", bounce: 0.35 }}
                 className="absolute inset-0 mx-auto mt-4 w-[280px] rounded-[2.5rem] border-[10px] border-foreground/30 bg-background shadow-pop glow-pop"
               >
                 <div className="h-full w-full overflow-hidden rounded-[1.7rem] bg-gradient-hero p-5">
                   <div className="flex items-center justify-between text-[10px] font-semibold text-foreground/70">
                     <span>9:41</span>
                     <span>FitAI</span>
                   </div>

                   <div className="mt-4">
                     <div className="text-xs uppercase tracking-wider text-accent">Today</div>
                     <div className="mt-1 text-2xl font-black leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                       Hey Maya 👋
                     </div>
                     <div className="text-xs text-muted-foreground">Ready for 28 min of joy?</div>
                   </div>

                   {/* Calorie ring */}
                   <div className="mt-5 flex items-center gap-4 rounded-2xl glass-strong p-3">
                     <CalorieRing value={1640} target={2200} />
                     <div>
                       <div className="text-[10px] uppercase text-muted-foreground">Calories</div>
                       <div className="text-xl font-bold">1,640</div>
                       <div className="text-[10px] text-muted-foreground">/ 2,200</div>
                     </div>
                   </div>

                   {/* Workout card */}
                   <div className="mt-3 rounded-2xl bg-gradient-neon p-4 text-primary-foreground">
                     <div className="flex items-center justify-between">
                       <div>
                         <div className="text-[10px] uppercase opacity-80">Main session</div>
                         <div className="text-base font-bold">HIIT + Mobility</div>
                       </div>
                       <Flame className="h-5 w-5" />
                     </div>
                     <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/30">
                       <motion.div initial={{ width: 0 }} animate={{ width: "65%" }} transition={{ duration: 1.6, delay: 1 }} className="h-full bg-white" />
                     </div>
                     <div className="mt-2 flex items-center justify-between text-[10px]">
                       <span>28 min · 3 segments</span>
                       <span className="rounded-full bg-white/25 px-2 py-0.5 font-semibold">▶ Play</span>
                     </div>
                   </div>

                   {/* Streak */}
                   <div className="mt-3 flex items-center justify-between rounded-2xl glass-strong p-3">
                     <div>
                       <div className="text-[10px] uppercase text-muted-foreground">Streak</div>
                       <div className="text-xl font-bold text-gradient-success">12 days 🔥</div>
                     </div>
                     <div className="flex gap-1">
                       {Array.from({ length: 7 }).map((_, i) => (
                         <div key={i} className={`h-7 w-2 rounded-full ${i < 5 ? "bg-gradient-neon" : "bg-foreground/10"}`} />
                       ))}
                     </div>
                   </div>
                 </div>
               </motion.div>

               {/* Floating sticker cards */}
               <motion.div
                 initial={{ opacity: 0, x: -40, rotate: -12 }}
                 animate={{ opacity: 1, x: 0, rotate: -8 }}
                 transition={{ duration: 0.7, delay: 0.4 }}
                 className="absolute -left-2 top-10 z-10 flex items-center gap-2 rounded-2xl glass-strong px-3 py-2 text-xs font-semibold animate-float"
               >
                 <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-success text-background">
                   <Heart className="h-3.5 w-3.5" />
                 </div>
                 <div>
                   <div className="text-[10px] text-muted-foreground">Heart rate</div>
                   <div>132 bpm</div>
                 </div>
               </motion.div>

               <motion.div
                 initial={{ opacity: 0, x: 40, rotate: 12 }}
                 animate={{ opacity: 1, x: 0, rotate: 6 }}
                 transition={{ duration: 0.7, delay: 0.55 }}
                 className="absolute -right-4 top-32 z-10 flex items-center gap-2 rounded-2xl glass-strong px-3 py-2 text-xs font-semibold animate-float"
                 style={{ animationDelay: "-2s" }}
               >
                 <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-fire text-background">
                   <Trophy className="h-3.5 w-3.5" />
                 </div>
                 <div>
                   <div className="text-[10px] text-muted-foreground">New PR</div>
                   <div>+12% strength</div>
                 </div>
               </motion.div>

               <motion.div
                 initial={{ opacity: 0, y: 40, rotate: -8 }}
                 animate={{ opacity: 1, y: 0, rotate: -4 }}
                 transition={{ duration: 0.7, delay: 0.7 }}
                 className="absolute -bottom-2 -left-6 z-10 flex items-center gap-2 rounded-2xl glass-strong px-3 py-2 text-xs font-semibold animate-float-slow"
               >
                 <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-cyan text-background">
                   <Zap className="h-3.5 w-3.5" />
                 </div>
                 <div>
                   <div className="text-[10px] text-muted-foreground">Energy</div>
                   <div>High 🔥</div>
                 </div>
               </motion.div>

              {/* Decorative emojis */}
              <div className="pointer-events-none absolute right-4 -top-2 text-3xl animate-bounce-soft" aria-hidden>🥦</div>
              <div className="pointer-events-none absolute left-8 bottom-12 text-3xl animate-float" aria-hidden>💧</div>
              <div className="pointer-events-none absolute right-0 bottom-4 text-3xl animate-wiggle" aria-hidden>🏋️</div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 rounded-3xl glass-strong p-6 md:grid-cols-4 border-glow">
            {[
              { v: "12k+", l: "Happy movers", g: "bg-gradient-fire" },
              { v: "1.8M", l: "Workouts done", g: "bg-gradient-cyan" },
              { v: "98%", l: "Stick past week 1", g: "bg-gradient-success" },
              { v: "$0", l: "Forever price", g: "bg-gradient-neon" },
            ].map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="text-center"
              >
                <div className={`mx-auto inline-block rounded-full ${s.g} bg-clip-text text-3xl font-black text-transparent md:text-4xl`} style={{ fontFamily: "var(--font-display)" }}>
                  {s.v}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="container mx-auto px-4 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary border border-primary/30">
              Everything in one premium app
            </span>
            <h2 className="mt-4 text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              Built for humans, not <span className="text-gradient-success">limitations.</span>
            </h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Sparkles, title: "AI workouts", body: "Daily plans tuned to your goal, level, and today's energy.", g: "bg-gradient-neon" },
              { icon: Dumbbell, title: "Real videos", body: "Hand-picked YouTube routines — never AI-faked.", g: "bg-gradient-cyan" },
              { icon: Salad, title: "Smart nutrition", body: "Track calories, macros & water in seconds.", g: "bg-gradient-fire" },
              { icon: MessageSquare, title: "Pocket coach", body: "Ask anything — form, swaps, meal ideas, motivation.", g: "bg-gradient-success" },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                className="hover-lift group relative overflow-hidden rounded-3xl glass-strong p-6 border-glow"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${f.g} text-primary-foreground shadow-pop`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                <div className="pointer-events-none absolute -right-10 -bottom-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60" style={{ background: "var(--gradient-neon)" }} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              Three steps. <span className="text-gradient-cyan">That's the whole thing.</span>
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                { n: "01", title: "Tell us about you", body: "Goal, level, equipment, schedule. ~60 seconds.", g: "bg-gradient-fire", emoji: "👋" },
                { n: "02", title: "Get your plan", body: "AI builds your daily workouts & nutrition targets.", g: "bg-gradient-success", emoji: "✨" },
                { n: "03", title: "Show up & smile", body: "Log meals, finish sessions, watch progress climb.", g: "bg-gradient-cyan", emoji: "🚀" },
              ].map((s, i) => (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.1 }}
                  className="hover-lift relative overflow-hidden rounded-3xl glass-strong p-6 border-glow"
                >
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${s.g} text-2xl shadow-pop`}>
                    {s.emoji}
                  </div>
                  <div className="mt-4 text-xs font-bold uppercase tracking-widest text-accent">Step {s.n}</div>
                  <h3 className="mt-1 text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
            {[
              { name: "Maya R.", role: "Lost 18 lbs in 4 months", body: "It feels like a friend, not a drill sergeant. I actually look forward to it.", g: "bg-gradient-fire" },
              { name: "Jonas K.", role: "First-time runner", body: "Plans adapt when I'm wrecked. Streak hit 47 days last week 🔥", g: "bg-gradient-success" },
              { name: "Aisha L.", role: "Busy mom of 2", body: "Cute, fast, never naggy. The water reminders made me cry (good cry).", g: "bg-gradient-cyan" },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="hover-lift relative overflow-hidden rounded-3xl glass-strong p-6 border-glow"
              >
                <div className="flex items-center gap-1 text-warning">
                  {Array.from({ length: 5 }).map((_, k) => <Star key={k} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="mt-3 text-base leading-relaxed">"{t.body}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${t.g} text-background`}>
                    <Smile className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* PRICING / CTA */}
        <section className="container mx-auto px-4 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="relative mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] p-10 md:p-14 text-center border-glow"
            style={{ background: "var(--gradient-neon)", backgroundSize: "200% 200%", animation: "var(--animate-pan)" }}
          >
            <div className="pointer-events-none absolute -top-10 -left-10 text-7xl opacity-30 animate-float" aria-hidden>🎉</div>
            <div className="pointer-events-none absolute -bottom-6 -right-6 text-7xl opacity-30 animate-bounce-soft" aria-hidden>💪</div>

            <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-foreground border border-white/30">
              Free. Forever.
            </span>
            <h2 className="mt-4 text-4xl font-black text-primary-foreground md:text-6xl" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
              Ready to feel <em className="not-italic underline decoration-wavy decoration-white/70 underline-offset-8">amazing</em>?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/90">
              Two minutes to set up. Zero credit cards. Pure premium experience.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-primary-foreground/90">
              {["Personalized plans", "Real video workouts", "Friendly AI coach", "Calorie + water tracking"].map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 border border-white/30">
                  <Check className="h-3.5 w-3.5" /> {p}
                </span>
              ))}
            </div>

            <Link to="/signup">
              <Button size="lg" className="mt-8 rounded-full bg-background text-primary hover:bg-background/90 glow-neon">
                Create your free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 text-sm text-muted-foreground md:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} FitAI · Build with Aysha Volidis</p>
        </div>
      </footer>
    </div>
  );
}

function CalorieRing({ value, target }: { value: number; target: number }) {
  const pct = Math.min(value / target, 1);
  const r = 22;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-14 w-14">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-foreground/10" />
        <motion.circle
          cx="28" cy="28" r={r} fill="none" stroke="url(#ring-grad-h)" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.6, delay: 0.6 }}
        />
        <defs>
          <linearGradient id="ring-grad-h" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF7A59" />
            <stop offset="50%" stopColor="#FFB662" />
            <stop offset="100%" stopColor="#FFE066" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Apple className="h-5 w-5 text-primary" />
      </div>
    </div>
  );
}
