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
import { ProjectCollectionForm } from "@/components/projects/project-collection-form";
import { ActionDialog } from "@/components/ui/action-dialog";
import { getProject } from "@/lib/actions/projects";
import { getCollections } from "@/lib/actions/collections";
import type { Collection } from "@/lib/types/database";
import { PROJECT_TYPE_LABELS } from "@/lib/types/database";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project;
  let collections: Collection[] = [];
  try {
    [project, collections] = await Promise.all([getProject(id), getCollections()]);
  } catch {
    notFound();
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <Link
            href={project.collection ? `/collections/${project.collection.id}` : "/projects"}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to {project.collection?.name ?? "projects"}
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                {project.name}
              </h1>
              <Badge variant="secondary">
                {PROJECT_TYPE_LABELS[project.project_type]}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionDialog
                title="New assumption"
                description="Add a driver that explains this projection."
                triggerLabel="Add assumption"
                triggerVariant="default"
              >
                <CreateAssumptionForm projectId={project.id} />
              </ActionDialog>
              <ActionDialog
                title="Save version"
                description="Create a named checkpoint before trying a new scenario."
                triggerLabel="Save version"
              >
                <CreateVersionForm projectId={project.id} />
              </ActionDialog>
              <ActionDialog
                title="Organize project"
                description="Add this project to a collection, move it, or leave it independent."
                triggerLabel={project.collection ? "Change collection" : "Add to collection"}
              >
                <ProjectCollectionForm
                  projectId={project.id}
                  initialCollectionId={project.collection_id}
                  collections={collections}
                />
              </ActionDialog>
              <ActionDialog title="Project settings" triggerLabel="Settings">
                <EditProjectForm
                  projectId={project.id}
                  initialName={project.name}
                  initialDescription={project.description}
                  initialProjectType={project.project_type}
                />
                <div className="mt-4 border-t pt-4">
                  <DeleteProjectButton
                    projectId={project.id}
                    collectionId={project.collection_id}
                  />
                </div>
              </ActionDialog>
            </div>
          </div>
          {project.description ? (
            <p className="text-muted-foreground">{project.description}</p>
          ) : null}
        </div>

        <section className="space-y-8">
          <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Projection editor</p>
            <p className="mt-2">
              Start with assumptions, then add line items and formulas as the next modeling layer.
            </p>
          </div>
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium">Key assumptions</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The reusable drivers that explain this projection.
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {project.assumptions?.length ?? 0} total
              </span>
            </div>
            <AssumptionList assumptions={project.assumptions ?? []} />
          </section>
          <section>
            <h2 className="mb-4 text-lg font-medium">Saved versions</h2>
            <VersionList versions={project.projection_versions ?? []} />
          </section>
          <section>
            <h2 className="mb-4 text-lg font-medium">Activity</h2>
            <ActivityFeed events={project.activity_events ?? []} />
          </section>
        </section>
      </div>
    </AppShell>
  );
}
