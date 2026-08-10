"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useActionDialog } from "@/components/ui/action-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/lib/actions/projects";
import {
  PROJECT_TYPE_LABELS,
  type Collection,
  type ProjectType,
} from "@/lib/types/database";

const PROJECT_TYPE_OPTIONS = Object.entries(PROJECT_TYPE_LABELS) as [
  ProjectType,
  string,
][];

export function CreateProjectForm({
  collections,
  initialCollectionId = null,
}: {
  collections: Pick<Collection, "id" | "name">[];
  initialCollectionId?: string | null;
}) {
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
        const formData = new FormData(form);

        startTransition(async () => {
          const result = await createProject(formData);
          if (result.error) {
            setError(result.error);
            return;
          }

          setError(null);
          form.reset();
          close();
          if (result.id) {
            router.push(`/projects/${result.id}`);
          } else {
            router.refresh();
          }
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          name="name"
          placeholder="Q1 Sales Forecast"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="project-collection">Collection (optional)</Label>
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
        <p className="text-xs text-muted-foreground">
          You can organize this project into a collection later.
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="project-description">Description</Label>
        <Input
          id="project-description"
          name="description"
          placeholder="Revenue by product line"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="project-type">Project type</Label>
        <select
          id="project-type"
          name="project_type"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          defaultValue="sales_forecast"
        >
          {PROJECT_TYPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create project"}
      </Button>
    </form>
  );
}
