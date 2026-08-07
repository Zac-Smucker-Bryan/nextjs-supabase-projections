"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject } from "@/lib/actions/projects";
import {
  PROJECT_TYPE_LABELS,
  type ProjectType,
} from "@/lib/types/database";

const PROJECT_TYPE_OPTIONS = Object.entries(PROJECT_TYPE_LABELS) as [
  ProjectType,
  string,
][];

export function CreateProjectForm({ collectionId }: { collectionId: string }) {
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
          const result = await createProject(collectionId, formData);
          if (result.error) {
            setError(result.error);
            return;
          }

          setError(null);
          event.currentTarget.reset();
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
