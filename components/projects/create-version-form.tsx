"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectionVersion } from "@/lib/actions/versions";

export function CreateVersionForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  return <form className="grid gap-3 rounded-xl border bg-card p-4" onSubmit={(event) => {
    event.preventDefault(); const form = event.currentTarget;
    startTransition(async () => { const result = await createProjectionVersion(projectId, new FormData(form)); if (result.error) return setError(result.error); setError(null); form.reset(); router.refresh(); });
  }}>
    <div className="grid gap-2"><Label htmlFor="version-name">Version name</Label><Input id="version-name" name="version_name" placeholder="v1 — Management review" required /></div>
    <div className="grid gap-2"><Label htmlFor="version-notes">Notes <span className="text-muted-foreground">(optional)</span></Label><Input id="version-notes" name="notes" placeholder="Updated pricing assumptions" /></div>
    {error ? <p className="text-sm text-destructive">{error}</p> : null}
    <Button type="submit" variant="outline" disabled={isPending}>{isPending ? "Saving..." : "Save version"}</Button>
  </form>;
}
