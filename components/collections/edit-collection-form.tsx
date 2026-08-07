"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCollection } from "@/lib/actions/collections";

export function EditCollectionForm({
  collectionId,
  initialName,
  initialDescription,
}: {
  collectionId: string;
  initialName: string;
  initialDescription: string | null;
}) {
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
          const result = await updateCollection(collectionId, formData);
          if (result.error) {
            setError(result.error);
            return;
          }

          setError(null);
          router.refresh();
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="edit-collection-name">Collection name</Label>
        <Input
          id="edit-collection-name"
          name="name"
          defaultValue={initialName}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-collection-description">Description</Label>
        <Input
          id="edit-collection-description"
          name="description"
          defaultValue={initialDescription ?? ""}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
