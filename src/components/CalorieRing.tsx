import { motion } from "framer-motion";

interface CalorieRingProps {
  value: number;
  target: number;
  size?: number;
  label?: string;
}

export function CalorieRing({ value, target, size = 160, label = "kcal" }: CalorieRingProps) {
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="currentColor" strokeWidth={stroke}
          className="text-foreground/10"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={`url(#calring-${size})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ duration: 1.4, ease: [0.2, 0.9, 0.3, 1.2] }}
        />
        <defs>
          <linearGradient id={`calring-${size}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold">{Math.round(value)}</div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">/ {target} {label}</div>
      </div>
    </div>
  );
}
