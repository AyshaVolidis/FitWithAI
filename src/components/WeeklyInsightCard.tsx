import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getCurrentWeeklyInsight, generateWeeklyInsight } from "@/lib/insights.functions";

// Minimal markdown renderer: ## headings + - bullets + paragraphs.
export function MarkdownLite({ text }: { text: string | null | undefined }) {
  if (!text) return null;
  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let bullets: string[] = [];
  const flush = (key: string) => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${key}`} className="my-2 ml-5 list-disc space-y-1 text-sm text-foreground/90">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      );
      bullets = [];
    }
  };
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) { flush(`b-${idx}`); return; }
    if (line.startsWith("## ")) {
      flush(`h-${idx}`);
      blocks.push(
        <h3 key={`h-${idx}`} className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary first:mt-0">
          {line.slice(3)}
        </h3>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      bullets.push(line.slice(2));
    } else {
      flush(`p-${idx}`);
      blocks.push(<p key={`p-${idx}`} className="my-1 text-sm text-foreground/90">{line}</p>);
    }
  });
  flush("end");
  return <div>{blocks}</div>;
}

export function WeeklyInsightCard() {
  const getFn = useServerFn(getCurrentWeeklyInsight);
  const genFn = useServerFn(generateWeeklyInsight);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [insight, setInsight] = useState<{ week_start: string; content: string } | null>(null);

  useEffect(() => {
    getFn()
      .then((d) => setInsight(d ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [getFn]);

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await genFn();
      setInsight(r);
      toast.success("Weekly insight ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate insight");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
            <Sparkles className="h-4 w-4" /> This week with Coach AI
          </div>
          <h2 className="mt-1 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Weekly review
          </h2>
        </div>
        {insight && (
          <Button size="sm" variant="outline" className="border-white/15" onClick={generate} disabled={generating}>
            <RefreshCw className={"mr-1 h-3 w-3 " + (generating ? "animate-spin" : "")} />
            Refresh
          </Button>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ) : insight ? (
          <MarkdownLite text={insight.content} />
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-5 text-center">
            <p className="text-sm text-muted-foreground">
              Get a personalized review of your last 7 days — workouts, nutrition, and weight trend.
            </p>
            <Button onClick={generate} disabled={generating} className="mt-4 bg-gradient-neon text-primary-foreground hover:opacity-90">
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? "Generating…" : "Generate this week's insight"}
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
