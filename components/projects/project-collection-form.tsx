"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useActionDialog } from "@/components/ui/action-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { setProjectCollection } from "@/lib/actions/projects";
import type { Collection } from "@/lib/types/database";

export function ProjectCollectionForm({
  projectId,
  initialCollectionId,
  collections,
}: {
  projectId: string;
  initialCollectionId: string | null;
  collections: Pick<Collection, "id" | "name">[];
}) {
  const router = useRouter();
  const { close } = useActionDialog();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const collectionId = String(new FormData(form).get("collection_id") ?? "").trim() || null;

        startTransition(async () => {
          const result = await setProjectCollection(projectId, collectionId);
          if (result.error) return setError(result.error);
          setError(null);
          close();
          router.refresh();
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="project-collection">Collection</Label>
        <select
          id="project-collection"
          name="collection_id"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          defaultValue={initialCollectionId ?? ""}
        >
          <option value="">No collection yet</option>
          {collections.map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save collection"}
      </Button>
    </form>
  );
}
