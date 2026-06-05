import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Users, Dumbbell, Apple, MessageSquare, Settings as SettingsIcon, LogOut, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { getAdminStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/admin/nutrition", label: "Nutrition", icon: Apple },
  { to: "/admin/chat-logs", label: "AI Chat Logs", icon: MessageSquare },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const;

function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const adminStatusFn = useServerFn(getAdminStatus);
  const navigate = useNavigate();
  const location = useLocation();
  const [authCheck, setAuthCheck] = useState<"loading" | "authorized" | "denied">("loading");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate({ to: "/login" as never }); return; }

    adminStatusFn({ data: { email: user.email! } }).then(({ isAdmin }) => {
      setAuthCheck(isAdmin ? "authorized" : "denied");
    }).catch(() => {
      setAuthCheck("denied");
    });
  }, [user, authLoading, navigate, adminStatusFn]);

  if (authLoading || authCheck === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (authCheck === "denied") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8">
        <Shield className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Access Denied</h1>
        <p className="text-center text-muted-foreground max-w-md">
          This admin panel is restricted to authorized administrators only.
        </p>
        <button onClick={() => navigate({ to: "/dashboard" as never })} className="text-sm text-primary underline underline-offset-4 hover:text-primary/80">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background md:pl-64">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[380px] w-[380px] rounded-full bg-gradient-sunny opacity-40 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-gradient-bubblegum opacity-30 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full bg-gradient-mint opacity-35 blur-3xl animate-blob" style={{ animationDelay: "-12s" }} />
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-foreground/5 bg-background/60 backdrop-blur-xl md:block">
        <div className="flex items-center gap-2 px-6 py-6">
          <Logo />
          <div className="flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
            <Shield className="h-3 w-3" /> Admin
          </div>
        </div>
        <nav className="px-3">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "mb-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-neon text-primary-foreground shadow-pop"
                    : "text-muted-foreground hover:bg-white/60 hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-6 left-3 right-3 space-y-1">
          <Link
            to={"/dashboard" as never}
            className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/60 hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" /> Back to app
          </Link>
          <button
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" as never }); }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      <main>
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-foreground/5 bg-background/85 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-6">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as never}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl transition-all", active && "bg-gradient-neon text-primary-foreground shadow-pop")}>
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
