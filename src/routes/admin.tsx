import { createFileRoute, Outlet, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Users, Dumbbell, Apple, MessageSquare, Settings as SettingsIcon, LogOut, Shield, AlertCircle, Megaphone, FileDown, MoreHorizontal, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
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
  { to: "/admin/notifications", label: "Notifications", icon: Megaphone },
  { to: "/admin/reports", label: "Reports", icon: FileDown },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const;

const MORE_ITEMS = [
  { to: "/admin/nutrition", label: "Nutrition", icon: Apple },
  { to: "/admin/notifications", label: "Notifications", icon: Megaphone },
  { to: "/admin/reports", label: "Reports & Exports", icon: FileDown },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const;

const MOBILE_NAV = [
  { to: "/admin/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/admin/chat-logs", label: "AI Chats", icon: MessageSquare },
  { to: "#more", label: "More", icon: MoreHorizontal },
] as const;

function AdminLayout() {
  const { user, loading: authLoading } = useAuth();
  const adminStatusFn = useServerFn(getAdminStatus);
  const navigate = useNavigate();
  const location = useLocation();
  const [authCheck, setAuthCheck] = useState<"loading" | "authorized" | "denied">("loading");
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  useEffect(() => {
    if (isMoreSheetOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMoreSheetOpen]);

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
    <div className="relative min-h-screen bg-background pb-20 md:pb-0 md:pl-64">
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
        <div className="absolute bottom-6 left-3 right-3">
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
        <div className="grid grid-cols-5">
          {MOBILE_NAV.map((item) => {
            if (item.to === "#more") {
              const active = isMoreSheetOpen || ["/admin/nutrition", "/admin/notifications", "/admin/reports", "/admin/settings"].some(r => location.pathname.startsWith(r));
              return (
                <button
                  key={item.to}
                  onClick={() => setIsMoreSheetOpen(prev => !prev)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl transition-all", active && "bg-gradient-neon text-primary-foreground shadow-pop")}>
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  {item.label}
                </button>
              );
            }
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

      <AnimatePresence>
        {isMoreSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40"
              onClick={() => setIsMoreSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background pb-8"
            >
              <div className="mx-auto mt-2 mb-4 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
              <div className="px-2">
                {MORE_ITEMS.map((item) => {
                  const active = location.pathname.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to as never}
                      onClick={() => setIsMoreSheetOpen(false)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-white/60",
                        active && "text-primary"
                      )}
                    >
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
