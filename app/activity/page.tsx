import { AppShell } from "@/components/app-shell";

export default function ActivityPage() {
  return <AppShell><div className="max-w-2xl"><h1 className="text-3xl font-semibold tracking-tight">Activity</h1><p className="mt-2 text-muted-foreground">Track changes and saved versions across your projections.</p><div className="mt-8 rounded-xl border border-dashed p-8 text-sm text-muted-foreground">Project activity appears on each individual project page. A workspace-wide activity stream will follow when your first projects are in place.</div></div></AppShell>;
}
