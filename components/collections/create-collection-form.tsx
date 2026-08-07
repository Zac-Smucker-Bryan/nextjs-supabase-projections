"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCollection } from "@/lib/actions/collections";

export function CreateCollectionForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4 rounded-xl border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await createCollection(formData);
          if (result.error) {
            setError(result.error);
            return;
          }

          setError(null);
          event.currentTarget.reset();
          if (result.id) {
            router.push(`/collections/${result.id}`);
          } else {
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="collection-name">Collection name</Label>
        <Input
          id="collection-name"
          name="name"
          placeholder="2026 Annual Plan"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="collection-description">Description</Label>
        <Input
          id="collection-description"
          name="description"
          placeholder="Sales forecast, P&L, and balance sheet"
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create collection"}
      </Button>
    </form>
  );
}
