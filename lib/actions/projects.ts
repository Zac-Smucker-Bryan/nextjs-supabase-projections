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
    collection: { id: string; name: string } | null;
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
      owner_id,
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

  const collection = Array.isArray(data.collection)
    ? data.collection[0]
    : data.collection;

  return {
    ...data,
    collection: collection
      ? { id: collection.id, name: collection.name }
      : null,
    activity_events: (data.activity_events ?? []) as ActivityEvent[],
    assumptions: (data.assumptions ?? []) as ProjectionAssumption[],
    projection_versions: (data.projection_versions ?? []) as ProjectionVersion[],
  } as Project & {
    collection: { id: string; name: string };
    activity_events: ActivityEvent[];
    assumptions: ProjectionAssumption[];
    projection_versions: ProjectionVersion[];
  };
}

export async function getProjects(): Promise<Project[]> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, owner_id, collection_id, name, description, project_type, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Project[];
}

async function validateCollectionOwnership(
  collectionId: string | null,
  userId: string,
) {
  if (!collectionId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error || !data) {
    return "Choose one of your own collections, or leave this project unfiled.";
  }

  return null;
}

function parseCollectionId(formData: FormData) {
  const value = String(formData.get("collection_id") ?? "").trim();
  return value || null;
}

export async function createProject(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const projectType = parseProjectType(formData.get("project_type"));
  const collectionId = parseCollectionId(formData);

  if (!name) {
    return { error: "Name is required." };
  }

  const collectionError = await validateCollectionOwnership(collectionId, user.id);
  if (collectionError) return { error: collectionError };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
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

  if (collectionId) revalidatePath(`/collections/${collectionId}`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
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
  if (existing.collection_id) revalidatePath(`/collections/${existing.collection_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  return { success: true };
}

export async function setProjectCollection(
  projectId: string,
  collectionId: string | null,
) {
  const user = await requireUser();
  const supabase = await createClient();

  const collectionError = await validateCollectionOwnership(collectionId, user.id);
  if (collectionError) return { error: collectionError };

  const { data: existing, error: fetchError } = await supabase
    .from("projects")
    .select("collection_id, name")
    .eq("id", projectId)
    .single();

  if (fetchError) return { error: fetchError.message };
  if (existing.collection_id === collectionId) {
    return { error: "This project is already in that collection." };
  }

  const { error } = await supabase
    .from("projects")
    .update({ collection_id: collectionId })
    .eq("id", projectId);

  if (error) return { error: error.message };

  await logActivity(
    projectId,
    "project_collection_changed",
    collectionId
      ? `Added project "${existing.name}" to a collection.`
      : `Removed project "${existing.name}" from its collection.`,
    { collection_id: collectionId },
  );

  if (existing.collection_id) revalidatePath(`/collections/${existing.collection_id}`);
  if (collectionId) revalidatePath(`/collections/${collectionId}`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProject(id: string, collectionId: string | null) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  if (collectionId) revalidatePath(`/collections/${collectionId}`);
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  return { success: true };
}
