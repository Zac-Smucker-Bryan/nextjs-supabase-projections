import { AppShell } from "@/components/app-shell";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { ProjectList } from "@/components/projects/project-list";
import { ActionDialog } from "@/components/ui/action-dialog";
import { getCollections } from "@/lib/actions/collections";
import { getProjects } from "@/lib/actions/projects";
import type { Collection, Project } from "@/lib/types/database";

export default async function ProjectsPage() {
  let projects: Project[] = [];
  let collections: Collection[] = [];
  let needsDatabaseSetup = false;

  try {
    [projects, collections] = await Promise.all([getProjects(), getCollections()]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("public.projects")) {
      needsDatabaseSetup = true;
    } else {
      throw error;
    }
  }

  const unfiledProjects = projects.filter((project) => !project.collection_id);
  const collectionProjects = collections
    .map((collection) => ({
      collection,
      projects: projects.filter((project) => project.collection_id === collection.id),
    }))
    .filter(({ projects: groupedProjects }) => groupedProjects.length > 0);

  return (
    <AppShell>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
              <p className="mt-2 text-muted-foreground">
                Start a projection on its own, then add it to a collection when it
                needs to connect with other work.
              </p>
            </div>
            {!needsDatabaseSetup ? (
              <ActionDialog
                title="New project"
                description="Start an independent projection or file it in a collection."
                triggerLabel="New project"
                triggerVariant="default"
              >
                <CreateProjectForm collections={collections} />
              </ActionDialog>
            ) : null}
          </div>

          {needsDatabaseSetup ? <DatabaseSetupNotice /> : null}

          {!needsDatabaseSetup && projects.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Create your first project—a sales forecast, financial statement,
              or another focused projection.
            </div>
          ) : null}

          {!needsDatabaseSetup && unfiledProjects.length > 0 ? (
            <section>
              <div className="mb-4">
                <h2 className="text-lg font-medium">Unfiled projects</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Independent projects that are not in a collection yet.
                </p>
              </div>
              <ProjectList projects={unfiledProjects} />
            </section>
          ) : null}

          {!needsDatabaseSetup && collectionProjects.length > 0 ? (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-medium">Projects in collections</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Projects organized into connected groups.
                </p>
              </div>
              {collectionProjects.map(({ collection, projects: groupedProjects }) => (
                <div key={collection.id}>
                  <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                    {collection.name}
                  </h3>
                  <ProjectList projects={groupedProjects} />
                </div>
              ))}
            </section>
          ) : null}
        </main>

      </div>
    </AppShell>
  );
}
