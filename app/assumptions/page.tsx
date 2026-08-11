import { AppShell } from "@/components/app-shell";
import { AssumptionList } from "@/components/projects/assumption-list";
import { getAssumptions } from "@/lib/actions/assumptions";

export default async function AssumptionsPage() {
  const assumptions = await getAssumptions();

  return (
    <AppShell>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Assumptions</h1>
        <p className="mt-2 text-muted-foreground">Assumptions are the drivers behind each projection.</p>
        <div className="mt-8">
          <AssumptionList assumptions={assumptions} />
        </div>
      </div>
    </AppShell>
  );
}
