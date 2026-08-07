import Link from "next/link";
import { notFound } from "next/navigation";

import { ActivityFeed } from "@/components/activity/activity-feed";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { DeleteProjectButton } from "@/components/projects/delete-project-button";
import { EditProjectForm } from "@/components/projects/edit-project-form";
import { AssumptionList } from "@/components/projects/assumption-list";
import { CreateAssumptionForm } from "@/components/projects/create-assumption-form";
import { CreateVersionForm } from "@/components/projects/create-version-form";
import { VersionList } from "@/components/projects/version-list";
import { getProject } from "@/lib/actions/projects";
import { PROJECT_TYPE_LABELS } from "@/lib/types/database";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <Link
            href={`/collections/${project.collection.id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to {project.collection.name}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              {project.name}
            </h1>
            <Badge variant="secondary">
              {PROJECT_TYPE_LABELS[project.project_type]}
            </Badge>
          </div>
          {project.description ? (
            <p className="text-muted-foreground">{project.description}</p>
          ) : null}
        </div>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div><h2 className="text-lg font-medium">Key assumptions</h2><p className="mt-1 text-sm text-muted-foreground">The reusable drivers that explain this projection.</p></div>
                <span className="text-sm text-muted-foreground">{project.assumptions?.length ?? 0} total</span>
              </div>
              <AssumptionList assumptions={project.assumptions ?? []} />
            </section>
            <section>
              <h2 className="mb-4 text-lg font-medium">Activity</h2>
              <ActivityFeed events={project.activity_events ?? []} />
            </section>
          </div>
          <aside className="space-y-8">
            <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Projection editor</p>
              <p className="mt-2">
                Start with assumptions, then add line items and formulas as the next modeling layer.
              </p>
            </div>
            <div><h2 className="mb-4 text-lg font-medium">New assumption</h2><CreateAssumptionForm projectId={project.id} /></div>
            <div><h2 className="mb-4 text-lg font-medium">Saved versions</h2><VersionList versions={project.projection_versions ?? []} /><div className="mt-3"><CreateVersionForm projectId={project.id} /></div></div>
            <div>
              <h2 className="mb-4 text-lg font-medium">Project settings</h2>
              <EditProjectForm
                projectId={project.id}
                initialName={project.name}
                initialDescription={project.description}
                initialProjectType={project.project_type}
              />
              <div className="mt-4">
                <DeleteProjectButton
                  projectId={project.id}
                  collectionId={project.collection_id}
                />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
