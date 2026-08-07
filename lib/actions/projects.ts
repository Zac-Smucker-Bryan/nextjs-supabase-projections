"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/actions/activity";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  ActivityEvent,
  Project,
  ProjectType,
  ProjectionAssumption,
  ProjectionVersion,
} from "@/lib/types/database";

const PROJECT_TYPES: ProjectType[] = [
  "general",
  "sales_forecast",
  "income_statement",
  "balance_sheet",
  "cash_flow",
];

function parseProjectType(value: FormDataEntryValue | null): ProjectType {
  const type = String(value ?? "general");
  return PROJECT_TYPES.includes(type as ProjectType)
    ? (type as ProjectType)
    : "general";
}

export async function getProject(id: string): Promise<
  Project & {
    collection: { id: string; name: string };
    activity_events: ActivityEvent[];
    assumptions: ProjectionAssumption[];
    projection_versions: ProjectionVersion[];
  }
> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      collection_id,
      name,
      description,
      project_type,
      created_at,
      updated_at,
      collection:collections (
        id,
        name
      ),
      activity_events (
        id,
        project_id,
        user_id,
        event_type,
        description,
        metadata,
        created_at
      ),
      assumptions (
        id,
        project_id,
        name,
        value,
        assumption_type,
        notes,
        created_at,
        updated_at
      ),
      projection_versions (
        id,
        project_id,
        version_name,
        notes,
        created_by,
        created_at
      )
    `,
    )
    .eq("id", id)
    .order("created_at", { ascending: false, foreignTable: "activity_events" })
    .order("created_at", { ascending: false, foreignTable: "projection_versions" })
    .order("created_at", { ascending: true, foreignTable: "assumptions" })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Project & {
    collection: { id: string; name: string };
    activity_events: ActivityEvent[];
    assumptions: ProjectionAssumption[];
    projection_versions: ProjectionVersion[];
  };
}

export async function createProject(collectionId: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const projectType = parseProjectType(formData.get("project_type"));

  if (!name) {
    return { error: "Name is required." };
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      collection_id: collectionId,
      name,
      description: description || null,
      project_type: projectType,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  await logActivity(
    data.id,
    "project_created",
    `Created project "${name}".`,
    { project_type: projectType },
  );

  revalidatePath(`/collections/${collectionId}`);
  revalidatePath("/dashboard");
  return { id: data.id as string };
}

export async function updateProject(id: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const projectType = parseProjectType(formData.get("project_type"));

  if (!name) {
    return { error: "Name is required." };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("projects")
    .select("collection_id, name")
    .eq("id", id)
    .single();

  if (fetchError) {
    return { error: fetchError.message };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      description: description || null,
      project_type: projectType,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  await logActivity(
    id,
    "project_updated",
    `Updated project "${name}".`,
    { previous_name: existing.name, project_type: projectType },
  );

  revalidatePath(`/projects/${id}`);
  revalidatePath(`/collections/${existing.collection_id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProject(id: string, collectionId: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/collections/${collectionId}`);
  revalidatePath("/dashboard");
  return { success: true };
}
