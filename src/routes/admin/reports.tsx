import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { FileDown, Users, Dumbbell, Apple, Loader2, Download, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  exportUsersCsv,
  exportWorkoutsCsv,
  exportNutritionCsv,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — FitAI Admin" }] }),
  component: ReportsPage,
});

const EXPORTS = [
  {
    key: "users",
    label: "Users",
    description: "Name, email, goal, fitness level, role, and account creation date",
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    fn: "exportUsersCsv",
    filename: "users-export.csv",
  },
  {
    key: "workouts",
    label: "Workouts",
    description: "Session date, status, duration, rating, difficulty, and user ID",
    icon: Dumbbell,
    color: "text-green-400",
    bg: "bg-green-500/10",
    fn: "exportWorkoutsCsv",
    filename: "workouts-export.csv",
  },
  {
    key: "nutrition",
    label: "Nutrition Logs",
    description: "Date, meal type, food name, calories, protein, carbs, fats, and user ID",
    icon: Apple,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    fn: "exportNutritionCsv",
    filename: "nutrition-export.csv",
  },
] as const;

function ReportsPage() {
  const usersFn = useServerFn(exportUsersCsv);
  const workoutsFn = useServerFn(exportWorkoutsCsv);
  const nutritionFn = useServerFn(exportNutritionCsv);
  const [exporting, setExporting] = useState<string | null>(null);

  const fns: Record<string, any> = {
    exportUsersCsv: usersFn,
    exportWorkoutsCsv: workoutsFn,
    exportNutritionCsv: nutritionFn,
  };

  const handleExport = async (item: (typeof EXPORTS)[number]) => {
    setExporting(item.key);
    try {
      const csv = await fns[item.fn]();
      if (!csv) {
        toast.error("No data to export");
        return;
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`${item.label} exported successfully`);
    } catch {
      toast.error(`Failed to export ${item.label.toLowerCase()}`);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          Reports & Exports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Download CSV reports of your app data
        </p>
      </motion.div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {EXPORTS.map((item, i) => (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card className="h-full">
              <CardHeader>
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", item.bg)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
                <CardTitle className="mt-3 text-base">{item.label}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleExport(item)}
                  disabled={exporting === item.key}
                >
                  {exporting === item.key ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              About Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <FileDown className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>CSV files can be opened in Excel, Google Sheets, or any spreadsheet application.</span>
              </li>
              <li className="flex items-start gap-2">
                <FileDown className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Workouts and nutrition exports are limited to the most recent 10,000 records.</span>
              </li>
              <li className="flex items-start gap-2">
                <FileDown className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>User emails are included for identification purposes.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
