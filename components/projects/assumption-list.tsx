import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ProjectionAssumption } from "@/lib/types/database";

function displayValue(assumption: ProjectionAssumption) {
  if (assumption.assumption_type === "percentage") return `${assumption.value}%`;
  if (assumption.assumption_type === "currency") return `$${assumption.value}`;
  return assumption.value;
}

export function AssumptionList({ assumptions }: { assumptions: ProjectionAssumption[] }) {
  if (!assumptions.length) {
    return <div className="rounded-xl border border-dashed p-7 text-center text-sm text-muted-foreground"><SlidersHorizontal className="mx-auto mb-2 size-6 opacity-60" />No assumptions yet. Add the drivers behind this model.</div>;
  }
  return <div className="overflow-hidden rounded-xl border bg-card">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b bg-muted/40 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground"><span>Driver</span><span>Value</span></div>
    {assumptions.map((assumption) => <div key={assumption.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b px-4 py-3 last:border-0">
      <div><p className="text-sm font-medium">{assumption.name}</p>{assumption.notes ? <p className="mt-1 text-xs text-muted-foreground">{assumption.notes}</p> : null}</div>
      <div className="text-right"><p className="text-sm font-semibold tabular-nums">{displayValue(assumption)}</p><Badge variant="secondary" className="mt-1 text-[10px]">{assumption.assumption_type}</Badge></div>
    </div>)}
  </div>;
}
