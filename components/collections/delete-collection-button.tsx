"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { deleteCollection } from "@/lib/actions/collections";

export function DeleteCollectionButton({ collectionId }: { collectionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        if (
          !window.confirm(
            "Delete this collection and all of its projects? This cannot be undone.",
          )
        ) {
          return;
        }

        startTransition(async () => {
          const result = await deleteCollection(collectionId);
          if (result.error) {
            window.alert(result.error);
            return;
          }

          router.push("/dashboard");
          router.refresh();
        });
      }}
    >
      {isPending ? "Deleting..." : "Delete collection"}
    </Button>
  );
}
