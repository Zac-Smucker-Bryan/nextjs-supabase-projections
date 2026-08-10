"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useActionDialog } from "@/components/ui/action-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { setProjectCollection } from "@/lib/actions/projects";
import type { Project } from "@/lib/types/database";

export function AddExistingProjectForm({
  collectionId,
  projects,
}: {
  collectionId: string;
  projects: Pick<Project, "id" | "name" | "collection_id">[];
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
        const projectId = String(new FormData(event.currentTarget).get("project_id") ?? "");

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
        <Label htmlFor="existing-project">Project</Label>
        <select
          id="existing-project"
          name="project_id"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          required
        >
          <option value="">Choose a project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
              {project.collection_id ? " (move from another collection)" : ""}
            </option>
          ))}
        </select>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding..." : "Add project"}
      </Button>
    </form>
  );
}
