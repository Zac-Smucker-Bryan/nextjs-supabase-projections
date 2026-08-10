"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/actions/activity";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AssumptionType } from "@/lib/types/database";

const ASSUMPTION_TYPES: AssumptionType[] = [
  "number",
  "percentage",
  "currency",
  "text",
];

export async function createAssumption(projectId: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const value = String(formData.get("value") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const requestedType = String(formData.get("assumption_type") ?? "number");
  const assumptionType = ASSUMPTION_TYPES.includes(requestedType as AssumptionType)
    ? (requestedType as AssumptionType)
    : "number";

  if (!name || (assumptionType !== "text" && !value)) {
    return { error: "A name is required, and non-text assumptions need a value." };
  }

  const { error } = await supabase.from("assumptions").insert({
    project_id: projectId,
    name,
    value,
    notes: notes || null,
    assumption_type: assumptionType,
  });

  if (error) return { error: error.message };

  await logActivity(projectId, "assumption_created", `Added assumption “${name}”.`, {
    assumption_type: assumptionType,
    value,
  });
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteAssumption(assumptionId: string, projectId: string) {
  await requireUser();
  const supabase = await createClient();

  const { data: assumption, error: fetchError } = await supabase
    .from("assumptions")
    .select("name")
    .eq("id", assumptionId)
    .eq("project_id", projectId)
    .single();

  if (fetchError) return { error: fetchError.message };

  const { error } = await supabase
    .from("assumptions")
    .delete()
    .eq("id", assumptionId)
    .eq("project_id", projectId);

  if (error) return { error: error.message };

  await logActivity(
    projectId,
    "assumption_deleted",
    `Removed assumption “${assumption.name}”.`,
  );
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
