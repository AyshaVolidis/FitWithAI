import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Home, Dumbbell, MessageSquare, TrendingUp, Settings as SettingsIcon, LogOut, Apple, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const NAV = [
  { to: "/dashboard", label: "Today", icon: Home },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/nutrition", label: "Nutrition", icon: Apple },
  { to: "/chat", label: "Coach", icon: MessageSquare },
  { to: "/progress", label: "Progress", icon: TrendingUp },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setIsAdmin(data?.role === "admin");
      });
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  const isPlayer = location.pathname.startsWith("/player");
  // Mobile shows top 5 nav items
  const MOBILE_NAV = NAV.slice(0, 5);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background pb-20 md:pb-0 md:pl-64">
      {/* Playful background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[380px] w-[380px] rounded-full bg-gradient-sunny opacity-40 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-32 h-[420px] w-[420px] rounded-full bg-gradient-bubblegum opacity-30 blur-3xl animate-blob" style={{ animationDelay: "-6s" }} />
        <div className="absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full bg-gradient-mint opacity-35 blur-3xl animate-blob" style={{ animationDelay: "-12s" }} />
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-foreground/5 bg-background/60 backdrop-blur-xl md:block">
        <div className="px-6 py-6">
          <Logo />
        </div>
        <nav className="px-3">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
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
        {isAdmin && (
          <div className="px-3 mt-2">
            <Link
              to={"/admin/overview"}
              className="mb-1 flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/10"
            >
              <Shield className="h-4 w-4" /> Admin Panel
            </Link>
          </div>
        )}
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}
          className="absolute bottom-6 left-3 right-3 flex items-center gap-3 rounded-2xl px-3 py-2 text-sm text-muted-foreground hover:bg-white/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <main>
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      {!isPlayer && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-foreground/5 bg-background/85 backdrop-blur-xl md:hidden">
          <div className="grid grid-cols-5">
            {MOBILE_NAV.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-2xl transition-all", active && "bg-gradient-neon text-primary-foreground shadow-pop")}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </div>
          {isAdmin && (
            <div className="flex justify-center pb-2">
              <Link
                to="/admin/overview"
                className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[10px] font-semibold text-primary"
              >
                <Shield className="h-3 w-3" /> Admin Panel
              </Link>
            </div>
          )}
        </nav>
      )}
    </div>
  );
}
