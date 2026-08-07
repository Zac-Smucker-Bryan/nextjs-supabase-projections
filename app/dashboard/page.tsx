import { AppShell } from "@/components/app-shell";
import { CollectionList } from "@/components/collections/collection-list";
import { CreateCollectionForm } from "@/components/collections/create-collection-form";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { getCollections } from "@/lib/actions/collections";
import type { CollectionWithProjects } from "@/lib/types/database";

export default async function DashboardPage() {
  let collections: CollectionWithProjects[] = [];
  let needsDatabaseSetup = false;

  try {
    collections = await getCollections();
  } catch (error) {
    // A new Supabase project has Auth ready before this app's custom tables
    // have been created. Show a helpful setup state rather than an error page.
    if (
      error instanceof Error &&
      error.message.includes("public.collections")
    ) {
      needsDatabaseSetup = true;
    } else {
      throw error;
    }
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Collections</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Group related projection projects — like a sales forecast, income
            statement, and balance sheet — into a single collection.
          </p>
        </div>

        {needsDatabaseSetup ? (
          <DatabaseSetupNotice />
        ) : (
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <h2 className="mb-4 text-lg font-medium">Your collections</h2>
              <CollectionList collections={collections} />
            </div>
            <aside>
              <h2 className="mb-4 text-lg font-medium">New collection</h2>
              <CreateCollectionForm />
            </aside>
          </section>
        )}
      </div>
    </AppShell>
  );
}
