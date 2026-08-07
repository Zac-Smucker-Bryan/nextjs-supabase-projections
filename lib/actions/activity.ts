"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";

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
}
