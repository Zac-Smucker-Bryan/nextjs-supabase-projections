import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DeleteCollectionButton } from "@/components/collections/delete-collection-button";
import { EditCollectionForm } from "@/components/collections/edit-collection-form";
import { CreateProjectForm } from "@/components/projects/create-project-form";
import { ProjectList } from "@/components/projects/project-list";
import { getCollection } from "@/lib/actions/collections";
import type { Project } from "@/lib/types/database";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let collection;
  try {
    collection = await getCollection(id);
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
        </div>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <h2 className="mb-4 text-lg font-medium">Projects</h2>
            <ProjectList projects={projects} />
          </div>
          <aside className="space-y-8">
            <div>
              <h2 className="mb-4 text-lg font-medium">New project</h2>
              <CreateProjectForm collectionId={collection.id} />
            </div>
            <div>
              <h2 className="mb-4 text-lg font-medium">Collection settings</h2>
              <EditCollectionForm
                collectionId={collection.id}
                initialName={collection.name}
                initialDescription={collection.description}
              />
              <div className="mt-4">
                <DeleteCollectionButton collectionId={collection.id} />
              </div>
            </div>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
