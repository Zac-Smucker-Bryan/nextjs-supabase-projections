import { Activity } from "lucide-react";
import Link from "next/link";

import type { ActivityEvent, ActivityEventWithProject } from "@/lib/types/database";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatEventType(eventType: string) {
  return eventType.replaceAll("_", " ");
}

function hasProject(event: ActivityEvent | ActivityEventWithProject): event is ActivityEventWithProject {
  return "project" in event;
}

export function ActivityFeed({ events }: { events: (ActivityEvent | ActivityEventWithProject)[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
        <Activity className="mx-auto mb-3 size-8 opacity-60" />
        <p className="font-medium text-foreground">No activity yet</p>
        <p className="mt-1 text-sm">
          Updates to this project will appear here.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li
          key={event.id}
          className="rounded-xl border px-4 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium capitalize">
              {formatEventType(event.event_type)}
            </p>
            <time
              className="text-xs text-muted-foreground"
              dateTime={event.created_at}
            >
              {formatDateTime(event.created_at)}
            </time>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.description}
          </p>
          {hasProject(event) ? (
            <Link href={`/projects/${event.project.id}`} className="mt-2 inline-flex text-xs font-medium text-primary hover:underline">
              {event.project.name}
            </Link>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
