import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

async function AuthenticatedRedirect() {
  if (!hasEnvVars) {
    return null;
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect("/dashboard");
  }

  return null;
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense>
        <AuthenticatedRedirect />
      </Suspense>

      <header className="border-b border-b-foreground/10">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 text-sm">
          <Link href="/" className="font-semibold tracking-tight">
            Projections
          </Link>
          {!hasEnvVars ? (
            <EnvVarWarning />
          ) : (
            <Suspense>
              <AuthButton />
            </Suspense>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-5 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">
            Financial modeling, made organized
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Build Your Business Financial Future
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Keep forecasts, assumptions, and supporting documents together in one workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        <ThemeSwitcher />
      </footer>
    </div>
  );
}
