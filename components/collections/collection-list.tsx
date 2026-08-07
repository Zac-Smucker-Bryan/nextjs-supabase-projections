import { FolderOpen } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CollectionWithProjects } from "@/lib/types/database";
import { PROJECT_TYPE_LABELS } from "@/lib/types/database";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function CollectionList({
  collections,
}: {
  collections: CollectionWithProjects[];
}) {
  if (collections.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        <FolderOpen className="mx-auto mb-3 size-8 opacity-60" />
        <p className="font-medium text-foreground">No collections yet</p>
        <p className="mt-1 text-sm">
          Create a collection to group related projection projects together.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {collections.map((collection) => (
        <Link key={collection.id} href={`/collections/${collection.id}`}>
          <Card className="h-full transition-colors hover:bg-accent/40">
            <CardHeader>
              <CardTitle className="text-lg">{collection.name}</CardTitle>
              {collection.description ? (
                <CardDescription>{collection.description}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Updated {formatDate(collection.updated_at)}
              </p>
              {collection.projects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {collection.projects.slice(0, 4).map((project) => (
                    <Badge key={project.id} variant="secondary">
                      {PROJECT_TYPE_LABELS[project.project_type]}
                    </Badge>
                  ))}
                  {collection.projects.length > 4 ? (
                    <Badge variant="outline">
                      +{collection.projects.length - 4} more
                    </Badge>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No projects yet</p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
