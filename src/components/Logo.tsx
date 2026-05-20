import { Activity } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const text = size === "sm" ? "text-base" : "text-xl";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`relative flex ${dim} items-center justify-center rounded-2xl bg-gradient-neon shadow-pop`}>
        <Activity className={`${icon} text-primary-foreground`} strokeWidth={2.6} />
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-success animate-bounce-soft" />
      </div>
      <span className={`${text} font-black tracking-tight`} style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}>
        Fit<span className="text-gradient-neon">AI</span>
      </span>
    </div>
  );
}

