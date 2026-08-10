"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useActionDialog } from "@/components/ui/action-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAssumption } from "@/lib/actions/assumptions";
import { ASSUMPTION_TYPE_LABELS, type AssumptionType } from "@/lib/types/database";

const options = Object.entries(ASSUMPTION_TYPE_LABELS) as [AssumptionType, string][];

export function CreateAssumptionForm({ projectId }: { projectId: string }) {
  const { close } = useActionDialog();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [assumptionType, setAssumptionType] =
    useState<AssumptionType>("percentage");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        startTransition(async () => {
          const result = await createAssumption(projectId, new FormData(form));
          if (result.error) return setError(result.error);
          setError(null);
          form.reset();
          close();
          router.refresh();
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="assumption-name">Assumption</Label>
        <Input id="assumption-name" name="name" placeholder="Annual growth rate" required />
      </div>
      <div className={assumptionType === "text" ? "grid gap-2" : "grid grid-cols-[1fr_120px] gap-2"}>
        {assumptionType !== "text" ? (
          <div className="grid gap-2">
            <Label htmlFor="assumption-value">Value</Label>
            <Input
              id="assumption-value"
              name="value"
              type="text"
              placeholder="8.5"
              required
            />
          </div>
        ) : null}
        <div className="grid gap-2">
          <Label htmlFor="assumption-type">Format</Label>
          <select
            id="assumption-type"
            name="assumption_type"
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
            value={assumptionType}
            onChange={(event) => setAssumptionType(event.target.value as AssumptionType)}
          >
            {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="assumption-notes">Context <span className="text-muted-foreground">(optional)</span></Label>
        <Input id="assumption-notes" name="notes" placeholder="Based on the FY25 plan" />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>{isPending ? "Adding..." : "Add assumption"}</Button>
    </form>
  );
}
