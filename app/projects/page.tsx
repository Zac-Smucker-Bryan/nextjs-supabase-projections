import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { DatabaseSetupNotice } from "@/components/database-setup-notice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCollections } from "@/lib/actions/collections";
import { PROJECT_TYPE_LABELS, type CollectionWithProjects } from "@/lib/types/database";

export default async function ProjectsPage() {
  let collections: CollectionWithProjects[] = [];
  let needsDatabaseSetup = false;
  try { collections = await getCollections(); } catch (error) {
    if (error instanceof Error && error.message.includes("public.collections")) needsDatabaseSetup = true;
    else throw error;
  }
  const projects = collections.flatMap((collection) => collection.projects.map((project) => ({ ...project, collection })));

  return <AppShell><div><h1 className="text-3xl font-semibold tracking-tight">Projects</h1><p className="mt-2 text-muted-foreground">Individual models and forecasts in your workspace.</p>{needsDatabaseSetup ? <div className="mt-8"><DatabaseSetupNotice /></div> : projects.length ? <div className="mt-8 grid gap-3 sm:grid-cols-2">{projects.map(({ collection, ...project }) => <Link key={project.id} href={`/projects/${project.id}`}><Card className="h-full transition-colors hover:bg-accent/40"><CardHeader><CardTitle className="text-base">{project.name}</CardTitle></CardHeader><CardContent className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">{collection.name}</span><Badge variant="secondary">{PROJECT_TYPE_LABELS[project.project_type]}</Badge></CardContent></Card></Link>)}</div> : <div className="mt-8 rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Create a collection, then add your first project.</div>}</div></AppShell>;
}
