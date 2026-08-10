import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DeleteCollectionButton } from "@/components/collections/delete-collection-button";
import { EditCollectionForm } from "@/components/collections/edit-collection-form";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { AddExistingProjectForm } from "@/components/projects/add-existing-project-form";
import { ProjectList } from "@/components/projects/project-list";
import { ActionDialog } from "@/components/ui/action-dialog";
import { getCollection, getCollections } from "@/lib/actions/collections";
import { getProjects } from "@/lib/actions/projects";
import type { Collection, Project } from "@/lib/types/database";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let collection;
  let collections: Collection[] = [];
  let allProjects: Project[] = [];
  try {
    [collection, collections, allProjects] = await Promise.all([
      getCollection(id),
      getCollections(),
      getProjects(),
    ]);
  } catch {
    notFound();
  }

  const projects = (collection.projects ?? []) as Project[];

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to collections
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {collection.name}
              </h1>
              {collection.description ? (
                <p className="mt-2 text-muted-foreground">
                  {collection.description}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <ActionDialog
                title="New project"
                description="Create a new project in this collection."
                triggerLabel="New project"
                triggerVariant="default"
              >
                <CreateProjectForm
                  collections={collections}
                  initialCollectionId={collection.id}
                />
              </ActionDialog>
              <ActionDialog
                title="Add existing project"
                description="Move one of your existing projects into this collection."
                triggerLabel="Add existing"
              >
                <AddExistingProjectForm
                  collectionId={collection.id}
                  projects={allProjects.filter((project) => project.collection_id !== collection.id)}
                />
              </ActionDialog>
              <ActionDialog title="Collection settings" triggerLabel="Settings">
                <EditCollectionForm
                  collectionId={collection.id}
                  initialName={collection.name}
                  initialDescription={collection.description}
                />
                <div className="mt-4 border-t pt-4">
                  <DeleteCollectionButton collectionId={collection.id} />
                </div>
              </ActionDialog>
            </div>
          </div>
        </div>

        <section>
          <h2 className="mb-4 text-lg font-medium">Projects</h2>
          <ProjectList projects={projects} />
        </section>
      </div>
    </AppShell>
  );
}
