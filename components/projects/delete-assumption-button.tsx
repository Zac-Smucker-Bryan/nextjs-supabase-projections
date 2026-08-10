"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteAssumption } from "@/lib/actions/assumptions";

export function DeleteAssumptionButton({
  assumptionId,
  projectId,
}: {
  assumptionId: string;
  projectId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={() => {
        if (!window.confirm("Remove this assumption? This cannot be undone.")) return;
        startTransition(async () => {
          const result = await deleteAssumption(assumptionId, projectId);
          if (result.error) return window.alert(result.error);
          router.refresh();
        });
      }}
    >
      {isPending ? "Removing..." : "Remove"}
    </Button>
  );
}
