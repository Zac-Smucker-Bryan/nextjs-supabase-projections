import Link from "next/link";
import { Suspense } from "react";
import {
  Activity,
  Database,
  FileStack,
  FolderKanban,
  FolderOpen,
  SlidersHorizontal,
} from "lucide-react";

import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";

export function AppShell({ children, title = "Projections" }: { children: React.ReactNode; title?: string }) {
  const mainNavigation = [
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/dashboard", label: "Collections", icon: FolderOpen },
    { href: "/assumptions", label: "Assumptions", icon: SlidersHorizontal },
    { href: "/activity", label: "Activity", icon: Activity },
  ];

  return <div className="min-h-screen bg-background md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
    <aside className="flex min-h-full flex-col border-b bg-muted/20 px-4 py-5 md:border-r md:border-b-0">
      <Link href="/dashboard" className="mb-8 px-2 text-lg font-semibold tracking-tight">{title}</Link>
      <nav aria-label="Main navigation" className="grid gap-1">
        {mainNavigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><Icon className="size-4" />{label}</Link>)}
      </nav>
      <div className="my-6 border-t" />
      <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Workspace</p>
      <nav aria-label="Upcoming workspace features" className="grid gap-1">
        <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/70"><FileStack className="size-4" />Templates <span className="ml-auto text-xs">Soon</span></span>
        <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground/70"><Database className="size-4" />Data sources <span className="ml-auto text-xs">Soon</span></span>
      </nav>
      <div className="mt-auto flex items-center gap-2 border-t pt-4">
        <ThemeSwitcher />
        <span className="text-sm text-muted-foreground">Appearance</span>
      </div>
    </aside>
    <div className="flex min-w-0 flex-col">
      <header className="border-b border-b-foreground/10"><div className="flex h-16 w-full items-center justify-end px-5 text-sm">{!hasEnvVars ? <EnvVarWarning /> : <Suspense><AuthButton /></Suspense>}</div></header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-8">{children}</main>
    </div>
  </div>;
}
