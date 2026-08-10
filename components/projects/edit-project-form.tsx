"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useActionDialog } from "@/components/ui/action-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProject } from "@/lib/actions/projects";
import {
  PROJECT_TYPE_LABELS,
  type ProjectType,
} from "@/lib/types/database";

const PROJECT_TYPE_OPTIONS = Object.entries(PROJECT_TYPE_LABELS) as [
  ProjectType,
  string,
][];

export function EditProjectForm({
  projectId,
  initialName,
  initialDescription,
  initialProjectType,
}: {
  projectId: string;
  initialName: string;
  initialDescription: string | null;
  initialProjectType: ProjectType;
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
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          const result = await updateProject(projectId, formData);
          if (result.error) {
            setError(result.error);
            return;
          }

          setError(null);
          close();
          router.refresh();
        });
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="edit-project-name">Project name</Label>
        <Input
          id="edit-project-name"
          name="name"
          defaultValue={initialName}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-project-description">Description</Label>
        <Input
          id="edit-project-description"
          name="description"
          defaultValue={initialDescription ?? ""}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-project-type">Project type</Label>
        <select
          id="edit-project-type"
          name="project_type"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          defaultValue={initialProjectType}
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
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
