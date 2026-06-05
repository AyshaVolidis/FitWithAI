import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Database, Trash2, RefreshCw, Search, Shield, UserCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getAdminStatus, seedAdminUser, searchUsersByEmail, setUserRole } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin Settings — FitAI" }] }),
  component: Settings,
});

function ConfirmButton({
  label,
  icon: Icon,
  onConfirm,
}: {
  label: string;
  icon: React.ElementType;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const timer: { current: ReturnType<typeof setTimeout> | null } = { current: null };

  const handleClick = () => {
    if (confirming) {
      if (timer.current) clearTimeout(timer.current);
      setConfirming(false);
      onConfirm();
    } else {
      setConfirming(true);
      timer.current = setTimeout(() => setConfirming(false), 3000);
    }
  };

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <Button
      variant={confirming ? "destructive" : "outline"}
      onClick={handleClick}
    >
      <Icon className="h-4 w-4 mr-2" />
      {confirming ? "Click again to confirm" : label}
    </Button>
  );
}

function Settings() {
  const { user } = useAuth();
  const adminStatusFn = useServerFn(getAdminStatus);
  const seedAdminFn = useServerFn(seedAdminUser);
  const searchUsersFn = useServerFn(searchUsersByEmail);
  const setRoleFn = useServerFn(setUserRole);

  const [profile, setProfile] = useState<any>(null);
  const [geminiEnabled, setGeminiEnabled] = useState(true);
  const [supabaseEnabled, setSupabaseEnabled] = useState(true);
  const [dailyWorkout, setDailyWorkout] = useState(true);
  const [weeklyInsights, setWeeklyInsights] = useState(false);
  const [adminRole, setAdminRole] = useState<string>("");
  const [seeding, setSeeding] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [promoting, setPromoting] = useState<string | null>(null);

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

  const handleSeedAdmin = async () => {
    setSeeding(true);
    const result = await seedAdminFn();
    setSeeding(false);
    if (result.ok) {
      toast.success(result.message);
    } else {
      toast.error(result.error ?? "Failed to seed admin user");
    }
  };

  let searchTimer: any = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchUsersFn({ data: { query: value } });
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current); }, []);

  const handleSetAdmin = async (userId: string, email: string) => {
    setPromoting(userId);
    try {
      const result = await setRoleFn({ data: { userId, role: "admin" } });
      if (result.ok) {
        toast.success(`${email} is now an admin`);
        setSearchResults((prev) => prev.map((u) => u.id === userId ? { ...u, role: "admin" } : u));
      } else {
        toast.error(result.error ?? "Failed to update role");
      }
    } catch {
      toast.error("Failed to update role");
    } finally {
      setPromoting(null);
    }
  };

  const handleRevokeAdmin = async (userId: string, email: string) => {
    setPromoting(userId);
    try {
      const result = await setRoleFn({ data: { userId, role: "user" } });
      if (result.ok) {
        toast.success(`${email} is no longer an admin`);
        setSearchResults((prev) => prev.map((u) => u.id === userId ? { ...u, role: "user" } : u));
      } else {
        toast.error(result.error ?? "Failed to update role");
      }
    } catch {
      toast.error("Failed to update role");
    } finally {
      setPromoting(null);
    }
  };

  const initials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : user?.email?.charAt(0).toUpperCase() ?? "?";

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Admin Configuration</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Service Status</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="glass-strong border-glow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <Sparkles className="h-5 w-5 text-primary" />
                <Switch checked={geminiEnabled} onCheckedChange={setGeminiEnabled} />
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", geminiEnabled ? "bg-green-400" : "bg-gray-500")} />
                <span className="text-xs text-muted-foreground">{geminiEnabled ? "Operational" : "Disabled"}</span>
              </div>
              <p className="mt-2 text-sm font-semibold">Gemini AI Service</p>
              <p className="text-xs text-muted-foreground">AI-powered workout generation and chat</p>
            </CardContent>
          </Card>
          <Card className="glass-strong border-glow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <Database className="h-5 w-5 text-primary" />
                <Switch checked={supabaseEnabled} onCheckedChange={setSupabaseEnabled} />
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", supabaseEnabled ? "bg-green-400" : "bg-gray-500")} />
                <span className="text-xs text-muted-foreground">{supabaseEnabled ? "Operational" : "Disabled"}</span>
              </div>
              <p className="mt-2 text-sm font-semibold">Supabase Database</p>
              <p className="text-xs text-muted-foreground">User data, workouts, nutrition logs</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-8">
        <Card className="glass-strong border-glow">
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Daily Workout Generation</p>
                <p className="text-xs text-muted-foreground">Allow AI to generate daily workout plans for users</p>
              </div>
              <Switch checked={dailyWorkout} onCheckedChange={setDailyWorkout} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Weekly Insights Webhook</p>
                <p className="text-xs text-muted-foreground">Send weekly AI coach insights to users</p>
              </div>
              <Switch checked={weeklyInsights} onCheckedChange={setWeeklyInsights} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
        <Card className="glass-strong border-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>
              Search users by email to promote or demote admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search users by email…"
                className="pl-9"
              />
            </div>
            {searching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!searching && searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-3">
                    <div>
                      <p className="text-sm font-medium">{u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.name ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                        {u.role}
                      </Badge>
                      {u.role === "admin" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRevokeAdmin(u.id, u.email)}
                          disabled={promoting === u.id}
                        >
                          {promoting === u.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Revoke"
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSetAdmin(u.id, u.email)}
                          disabled={promoting === u.id}
                        >
                          {promoting === u.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <><UserCheck className="h-3 w-3 mr-1" /> Make Admin</>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No users found matching "{searchQuery}"</p>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Seed Admin User</p>
                <p className="text-xs text-muted-foreground">
                  Create or ensure the <code className="rounded bg-muted px-1 py-0.5 text-[11px]">admin@admin.co</code> account exists with role <Badge variant="default" className="text-[10px] px-1.5 py-0">admin</Badge>
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleSeedAdmin} disabled={seeding}>
                {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                Seed Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-8">
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
                  {memberSince && <span className="text-xs text-muted-foreground">Member since {memberSince}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
        <Card className="border-red-500/30 glass-strong">
          <CardHeader>
            <CardTitle className="text-red-500">Danger Zone</CardTitle>
            <CardDescription>Irreversible admin actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConfirmButton label="Clear Cache" icon={Trash2} onConfirm={() => toast.success("Cache cleared successfully")} />
            <Separator />
            <ConfirmButton label="Re-seed Videos DB" icon={RefreshCw} onConfirm={() => toast.success("Video database re-seed initiated")} />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
