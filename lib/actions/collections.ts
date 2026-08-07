"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Collection, CollectionWithProjects } from "@/lib/types/database";

export async function getCollections(): Promise<CollectionWithProjects[]> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("collections")
    .select(
      `
      id,
      owner_id,
      name,
      description,
      created_at,
      updated_at,
      projects (
        id,
        name,
        project_type,
        updated_at
      )
    `,
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CollectionWithProjects[];
}

export async function getCollection(id: string): Promise<CollectionWithProjects> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("collections")
    .select(
      `
      id,
      owner_id,
      name,
      description,
      created_at,
      updated_at,
      projects (
        id,
        name,
        description,
        project_type,
        created_at,
        updated_at
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CollectionWithProjects;
}

export async function createCollection(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  const { data, error } = await supabase
    .from("collections")
    .insert({
      owner_id: user.id,
      name,
      description: description || null,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { id: data.id as string };
}

export async function updateCollection(id: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  const { error } = await supabase
    .from("collections")
    .update({
      name,
      description: description || null,
    })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/collections/${id}`);
  return { success: true };
}

export async function deleteCollection(id: string) {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("collections").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export type CollectionSummary = Pick<
  Collection,
  "id" | "name" | "description" | "updated_at"
>;
