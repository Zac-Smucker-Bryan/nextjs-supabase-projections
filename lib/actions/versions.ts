"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/actions/activity";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createProjectionVersion(projectId: string, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const versionName = String(formData.get("version_name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!versionName) return { error: "A version name is required." };

  const { error } = await supabase.from("projection_versions").insert({
    project_id: projectId,
    version_name: versionName,
    notes: notes || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  await logActivity(projectId, "version_created", `Saved version “${versionName}”.`);
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
