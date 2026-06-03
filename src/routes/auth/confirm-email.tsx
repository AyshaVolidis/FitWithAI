import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Mail, ArrowRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/confirm-email")({
  head: () => ({
    meta: [
      { title: "Check your email — FitAI" },
    ],
  }),
  component: ConfirmEmail,
});

function ConfirmEmail() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <Link to="/" className="mb-8 flex items-center justify-center">
          <Logo />
        </Link>
        <div className="glass rounded-2xl p-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-neon text-primary-foreground shadow-pop">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link. Click it to activate your account, then sign in.
          </p>
          <div className="mt-6 space-y-3">
            <Link to="/login">
              <Button className="w-full bg-gradient-neon text-primary-foreground hover:opacity-90">
                Go to sign in
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Didn't get the email? Check your spam folder, or{" "}
              <Link to="/signup" className="text-primary hover:underline">try signing up again</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
