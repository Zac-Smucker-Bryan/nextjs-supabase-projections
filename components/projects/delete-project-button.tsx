"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteProject } from "@/lib/actions/projects";

export function DeleteProjectButton({
  projectId,
  collectionId,
}: {
  projectId: string;
  collectionId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Delete this project? This cannot be undone.")) {
          return;
        }

        startTransition(async () => {
          const result = await deleteProject(projectId, collectionId);
          if (result.error) {
            window.alert(result.error);
            return;
          }

          router.push(collectionId ? `/collections/${collectionId}` : "/projects");
          router.refresh();
        });
      }}
    >
      {isPending ? "Deleting..." : "Delete project"}
    </Button>
  );
}
