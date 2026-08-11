import Link from "next/link";
import { notFound } from "next/navigation";

import { CreateProjectionModelForm } from "@/components/projections/create-projection-model-form";
import { ProjectionGrid } from "@/components/projections/projection-grid";
import { ProjectionSettingsForm } from "@/components/projections/projection-settings-form";
import { AssumptionList } from "@/components/projects/assumption-list";
import { CreateAssumptionForm } from "@/components/projects/create-assumption-form";
import { ActionDialog } from "@/components/ui/action-dialog";
import { getProject } from "@/lib/actions/projects";
import { getProjectionModel } from "@/lib/actions/projection-model";

export default async function ProjectionEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let project;
  let model;
  try {
    [project, model] = await Promise.all([getProject(id), getProjectionModel(id)]);
  } catch {
    notFound();
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b px-5">
        <Link href={`/projects/${project.id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to project
        </Link>
        <p className="min-w-0 truncate text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{project.name}</span> · Projection model
        </p>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">Saved automatically</span>
          {model ? <ActionDialog title="Projection settings" description="Update how this projection is structured." triggerLabel="Settings"><ProjectionSettingsForm projectId={project.id} model={model} /></ActionDialog> : null}
          <ActionDialog
            title="Assumptions"
            description="Reusable drivers for this projection. Use the @ button in the formula bar to insert a numeric driver."
            triggerLabel="Assumptions"
            triggerVariant="default"
          >
            <div className="grid gap-5">
              <CreateAssumptionForm projectId={project.id} />
              <AssumptionList assumptions={project.assumptions ?? []} />
            </div>
          </ActionDialog>
        </div>
      </header>
      <main className="min-h-0 w-full flex-1 overflow-hidden px-5 py-4">
        {model ? (
          <ProjectionGrid projectId={project.id} model={model} assumptions={project.assumptions ?? []} />
        ) : (
          <div className="mx-auto mt-16 max-w-lg rounded-xl border border-dashed p-6">
            <h1 className="text-lg font-semibold">Set up this projection</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Choose its first month and projection length before adding rows and formulas.
            </p>
            <div className="mt-4">
              <ActionDialog title="Set up projection" triggerLabel="Set up projection" triggerVariant="default">
                <CreateProjectionModelForm projectId={project.id} />
              </ActionDialog>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
