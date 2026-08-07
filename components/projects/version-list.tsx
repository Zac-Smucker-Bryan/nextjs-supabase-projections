import { GitBranch } from "lucide-react";

import type { ProjectionVersion } from "@/lib/types/database";

function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }

export function VersionList({ versions }: { versions: ProjectionVersion[] }) {
  if (!versions.length) return <div className="rounded-xl border border-dashed p-7 text-center text-sm text-muted-foreground"><GitBranch className="mx-auto mb-2 size-6 opacity-60" />No saved versions yet.</div>;
  return <ol className="space-y-3">{versions.map((version) => <li key={version.id} className="rounded-xl border bg-card p-4"><div className="flex justify-between gap-3"><p className="text-sm font-medium">{version.version_name}</p><time className="shrink-0 text-xs text-muted-foreground">{formatDate(version.created_at)}</time></div>{version.notes ? <p className="mt-1 text-sm text-muted-foreground">{version.notes}</p> : null}</li>)}</ol>;
}
