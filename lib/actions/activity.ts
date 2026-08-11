"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import type { ActivityEventWithProject } from "@/lib/types/database";

export async function getActivityEvents(): Promise<ActivityEventWithProject[]> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_events")
    .select(
      `
      id,
      project_id,
      user_id,
      event_type,
      description,
      metadata,
      created_at,
      project:projects!inner (
        id,
        name
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  return (data ?? []).map((event) => {
    const project = Array.isArray(event.project)
      ? event.project[0]
      : event.project;

    return {
      ...event,
      project: {
        id: project.id,
        name: project.name,
      },
    };
  }) as ActivityEventWithProject[];
}

export async function logActivity(
  projectId: string,
  eventType: string,
  description: string,
  metadata: Record<string, unknown> = {},
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("activity_events").insert({
    project_id: projectId,
    user_id: user.id,
    event_type: eventType,
    description,
    metadata,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/activity");
}
