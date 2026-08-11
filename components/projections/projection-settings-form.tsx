"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useActionDialog } from "@/components/ui/action-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProjectionModelSettings } from "@/lib/actions/projection-model";
import type { ProjectionModel } from "@/lib/types/database";

export function ProjectionSettingsForm({ projectId, model }: { projectId: string; model: ProjectionModel }) {
  const { close } = useActionDialog();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  return <form className="grid gap-4" onSubmit={(event) => {
    event.preventDefault();
    const form = event.currentTarget;
    startTransition(async () => {
      const result = await updateProjectionModelSettings(projectId, model.id, new FormData(form));
      if (result.error) return setError(result.error);
      close();
      router.refresh();
    });
  }}>
    <div className="grid gap-2"><Label htmlFor="settings-start-date">Start month</Label><Input id="settings-start-date" name="start_date" type="date" defaultValue={model.start_date} required /></div>
    <div className="grid gap-2"><Label htmlFor="settings-horizon">Projection length (years)</Label><Input id="settings-horizon" name="horizon_years" type="number" min="1" max="10" defaultValue={model.horizon_years} required /></div>
    <div className="grid gap-2"><Label htmlFor="settings-monthly-years">Monthly detail</Label><select id="settings-monthly-years" name="monthly_years" className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" defaultValue={model.monthly_years ?? 1}><option value="1">First year</option><option value="2">First two years</option></select></div>
    <p className="text-xs text-muted-foreground">After you enter values, the start date and monthly detail are protected to prevent accidental data loss. You can still extend the horizon.</p>
    {error ? <p className="text-sm text-destructive">{error}</p> : null}
    <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save settings"}</Button>
  </form>;
}
