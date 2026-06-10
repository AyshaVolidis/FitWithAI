import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Dumbbell,
  Clock,
  BarChart3,
  GripVertical,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  getAdminStatus,
  getWorkoutTemplates,
  createWorkoutTemplate,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin Settings — FitAI" }] }),
  component: Settings,
});

type Exercise = {
  name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  rest_seconds: number;
  notes: string;
  youtube_url: string;
};

type Template = {
  id: string;
  name: string;
  description: string;
  goal: string | null;
  fitness_level: string | null;
  duration_minutes: number;
  exercises: Exercise[];
  created_at: string;
};

const emptyExercise = (): Exercise => ({
  name: "",
  sets: 3,
  reps: 10,
  weight_kg: 0,
  rest_seconds: 60,
  notes: "",
  youtube_url: "",
});

const GOALS = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "build_muscle", label: "Build Muscle" },
  { value: "improve_endurance", label: "Improve Endurance" },
  { value: "general_fitness", label: "General Fitness" },
  { value: "flexibility", label: "Flexibility" },
];

const LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

function TemplateDialog({
  template,
  open,
  onOpenChange,
  onSaved,
}: {
  template?: Template | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
}) {
  const createFn = useServerFn(createWorkoutTemplate);
  const updateFn = useServerFn(updateWorkoutTemplate);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(template?.name ?? "");
  const [description, setDescription] = useState(template?.description ?? "");
  const [goal, setGoal] = useState(template?.goal ?? "");
  const [fitnessLevel, setFitnessLevel] = useState(template?.fitness_level ?? "");
  const [duration, setDuration] = useState(template?.duration_minutes ?? 30);
  const [exercises, setExercises] = useState<Exercise[]>(template?.exercises ?? [emptyExercise()]);

  useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setDescription(template?.description ?? "");
      setGoal(template?.goal ?? "");
      setFitnessLevel(template?.fitness_level ?? "");
      setDuration(template?.duration_minutes ?? 30);
      setExercises(template?.exercises?.length ? template.exercises : [emptyExercise()]);
    }
  }, [open, template]);

  const addExercise = () => setExercises([...exercises, emptyExercise()]);
  const removeExercise = (i: number) => {
    if (exercises.length <= 1) return;
    setExercises(exercises.filter((_, idx) => idx !== i));
  };
  const updateExercise = (i: number, field: keyof Exercise, value: string | number) => {
    const next = [...exercises];
    (next[i] as any)[field] = value;
    setExercises(next);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    const validExercises = exercises.filter((e) => e.name.trim());
    if (validExercises.length === 0) {
      toast.error("At least one exercise is required");
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      goal: goal || null,
      fitness_level: fitnessLevel || null,
      duration_minutes: duration,
      exercises: validExercises.map((e) => ({
        ...e,
        name: e.name.trim(),
        notes: e.notes.trim(),
      })),
    };
    const result = template
      ? await updateFn({ data: { id: template.id, ...payload } })
      : await createFn({ data: payload });
    setSaving(false);
    if (result.ok) {
      toast.success(result.message);
      onOpenChange(false);
      onSaved();
    } else {
      toast.error(result.error ?? "Failed to save");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "New Template"}</DialogTitle>
          <DialogDescription>
            {template
              ? "Update the workout template details"
              : "Create a new reusable workout template"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Full Body Strength"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the workout"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Goal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue placeholder="Any goal" />
                </SelectTrigger>
                <SelectContent>
                  {GOALS.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Level</Label>
              <Select value={fitnessLevel} onValueChange={setFitnessLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Exercises</Label>
            <Button size="sm" variant="outline" onClick={addExercise}>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
          <div className="space-y-3">
            {exercises.map((ex, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      value={ex.name}
                      onChange={(e) => updateExercise(i, "name", e.target.value)}
                      placeholder="Exercise name"
                      className="flex-1"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 text-destructive"
                      onClick={() => removeExercise(i)}
                      disabled={exercises.length <= 1}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-[10px]">Sets</Label>
                      <Input
                        type="number"
                        min={1}
                        value={ex.sets}
                        onChange={(e) => updateExercise(i, "sets", Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Reps</Label>
                      <Input
                        type="number"
                        min={1}
                        value={ex.reps}
                        onChange={(e) => updateExercise(i, "reps", Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Weight (kg)</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={ex.weight_kg}
                        onChange={(e) => updateExercise(i, "weight_kg", Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Rest (sec)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={ex.rest_seconds}
                        onChange={(e) => updateExercise(i, "rest_seconds", Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <Input
                    value={ex.notes}
                    onChange={(e) => updateExercise(i, "notes", e.target.value)}
                    placeholder="Optional notes (form, cues, etc.)"
                    className="text-xs"
                  />
                  <Input
                    value={ex.youtube_url}
                    onChange={(e) => updateExercise(i, "youtube_url", e.target.value)}
                    placeholder="YouTube link (e.g. https://youtube.com/watch?v=...)"
                    className="text-xs"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {template ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteDialog({
  template,
  open,
  onOpenChange,
  onDeleted,
}: {
  template: Template | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDeleted: () => void;
}) {
  const deleteFn = useServerFn(deleteWorkoutTemplate);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!template) return;
    setDeleting(true);
    const result = await deleteFn({ data: { id: template.id } });
    setDeleting(false);
    if (result.ok) {
      toast.success(result.message);
      onOpenChange(false);
      onDeleted();
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Template</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{template?.name}"? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const adminStatusFn = useServerFn(getAdminStatus);
  const getTemplatesFn = useServerFn(getWorkoutTemplates);

  const [profile, setProfile] = useState<any>(null);
  const [adminRole, setAdminRole] = useState<string>("");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("name, created_at, role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setProfile(data);
        setAdminRole(data?.role ?? "");
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    adminStatusFn({ data: { email: user.email! } }).then(({ role }) => setAdminRole(role));
  }, [user]);

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    const results = await getTemplatesFn();
    setTemplates(results as Template[]);
    setTemplatesLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : (user?.email?.charAt(0).toUpperCase() ?? "?");

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const goalLabel = (g: string | null) => GOALS.find((x) => x.value === g)?.label ?? g ?? "Any";
  const levelLabel = (l: string | null) => LEVELS.find((x) => x.value === l)?.label ?? l ?? "Any";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Admin Configuration</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8"
      >
        <Card className="glass-strong border-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Workout Template Library
            </CardTitle>
            <CardDescription>Create and manage reusable workout templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Template
              </Button>
            </div>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : templates.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No templates yet. Create your first workout template.
              </div>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <Card key={t.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{t.name}</span>
                            {t.goal && (
                              <Badge variant="secondary" className="text-[10px]">
                                {goalLabel(t.goal)}
                              </Badge>
                            )}
                            {t.fitness_level && (
                              <Badge variant="outline" className="text-[10px]">
                                {levelLabel(t.fitness_level)}
                              </Badge>
                            )}
                          </div>
                          {t.description && (
                            <p className="text-xs text-muted-foreground">{t.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {t.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {t.exercises.length} exercises
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-4">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingTemplate(t);
                              setTemplateDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => {
                              setDeletingTemplate(t);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8"
      >
        <Card className="glass-strong border-glow">
          <CardHeader>
            <CardTitle>Admin Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-lg font-semibold">{profile?.name ?? "Admin"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="default">Admin</Badge>
                  {memberSince && (
                    <span className="text-xs text-muted-foreground">
                      Member since {memberSince}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </motion.div>

      <TemplateDialog
        key={editingTemplate?.id ?? "new"}
        template={editingTemplate}
        open={templateDialogOpen}
        onOpenChange={(v) => {
          setTemplateDialogOpen(v);
          if (!v) setEditingTemplate(null);
        }}
        onSaved={loadTemplates}
      />
      <ConfirmDeleteDialog
        template={deletingTemplate}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={loadTemplates}
      />
    </div>
  );
}
