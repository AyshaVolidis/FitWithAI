import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — FitAI" },
      {
        name: "description",
        content: "Create a free FitAI account and get your AI fitness plan in minutes.",
      },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback",
        data: { name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (data?.session) {
      navigate({ to: "/onboarding" });
    } else {
      navigate({ to: "/auth/confirm-email", state: { email } });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 animate-blob rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-72 w-72 animate-blob rounded-full bg-accent/15 blur-3xl [animation-delay:2s]" />
        <div className="absolute bottom-1/4 left-1/4 h-64 w-64 animate-blob rounded-full bg-success/10 blur-3xl [animation-delay:4s]" />
      </div>

      <div className="w-full max-w-sm animate-rise">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center transition-opacity hover:opacity-80"
        >
          <Logo />
        </Link>

        <div className="glass rounded-2xl p-8">
          <div className="mb-2 h-1 w-12 rounded-full bg-gradient-neon" />
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Create your account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Free forever. No credit card.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="group">
              <Label htmlFor="name" className="text-sm font-medium">
                Name
              </Label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 pl-10 border-white/10 transition-all duration-300"
                />
              </div>
            </div>

            <div className="group">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 pl-10 border-white/10 transition-all duration-300"
                />
              </div>
            </div>

            <div className="group">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 pl-10 pr-10 border-white/10 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-neon text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary transition-colors hover:text-primary/80 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
