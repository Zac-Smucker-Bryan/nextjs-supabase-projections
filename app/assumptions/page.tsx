import { AppShell } from "@/components/app-shell";

export default function AssumptionsPage() {
  return <AppShell><div className="max-w-2xl"><h1 className="text-3xl font-semibold tracking-tight">Assumptions</h1><p className="mt-2 text-muted-foreground">Assumptions are the drivers behind each projection.</p><div className="mt-8 rounded-xl border border-dashed p-8 text-sm text-muted-foreground">Add and manage assumptions from an individual project. A workspace-wide assumptions view will follow when the assumptions table is set up.</div></div></AppShell>;
}
