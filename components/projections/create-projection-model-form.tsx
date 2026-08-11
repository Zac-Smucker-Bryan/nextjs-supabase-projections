"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useActionDialog } from "@/components/ui/action-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectionModel } from "@/lib/actions/projection-model";

export function CreateProjectionModelForm({ projectId }: { projectId: string }) {
  const { close } = useActionDialog();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        startTransition(async () => {
          const result = await createProjectionModel(projectId, new FormData(form));
          if (result.error) return setError(result.error);
          setError(null);
          close();
          router.refresh();
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="projection-start-date">Start month</Label>
        <Input id="projection-start-date" name="start_date" type="date" required />
        <p className="text-xs text-muted-foreground">
          We create monthly columns through December of this calendar year.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="projection-horizon">Projection length (years)</Label>
        <Input
          id="projection-horizon"
          name="horizon_years"
          type="number"
          min="1"
          max="10"
          defaultValue="3"
          required
        />
        <p className="text-xs text-muted-foreground">
          Up to 10 years. Following years appear as annual columns.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="projection-monthly-years">Monthly detail</Label>
        <select id="projection-monthly-years" name="monthly_years" className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" defaultValue="1">
          <option value="1">First year</option>
          <option value="2">First two years</option>
        </select>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating…" : "Create projection"}
      </Button>
    </form>
  );
}
