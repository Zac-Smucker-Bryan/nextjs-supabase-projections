import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "@/lib/types/database";
import { PROJECT_TYPE_LABELS } from "@/lib/types/database";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function ProjectList({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        <p className="font-medium text-foreground">No projects yet</p>
        <p className="mt-1 text-sm">
          Add a sales forecast, income statement, or other projection project.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <Card className="transition-colors hover:bg-accent/40">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  {project.description ? (
                    <CardDescription>{project.description}</CardDescription>
                  ) : null}
                </div>
                <Badge variant="secondary">
                  {PROJECT_TYPE_LABELS[project.project_type]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Updated {formatDate(project.updated_at)}
              </p>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
