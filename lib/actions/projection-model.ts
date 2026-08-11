"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/actions/activity";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ProjectionModelWithGrid } from "@/lib/types/database";

function buildPeriods(startDate: string, horizonYears: number, monthlyYears = 1) {
  const start = new Date(`${startDate}T00:00:00`);
  const startYear = start.getUTCFullYear();
  const periods: {
    period_start: string;
    period_end: string;
    label: string;
    granularity: "month" | "year";
    position: number;
  }[] = [];
  let position = 0;

  for (let monthOffset = 0; monthOffset < (12 - start.getUTCMonth()) + 12 * (monthlyYears - 1); monthOffset += 1) {
    const periodStart = new Date(Date.UTC(startYear, start.getUTCMonth() + monthOffset, 1));
    const periodEnd = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0));
    periods.push({
      period_start: periodStart.toISOString().slice(0, 10),
      period_end: periodEnd.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(periodStart),
      granularity: "month",
      position: position++,
    });
  }

  for (let year = startYear + monthlyYears; year < startYear + horizonYears; year += 1) {
    periods.push({
      period_start: `${year}-01-01`,
      period_end: `${year}-12-31`,
      label: String(year),
      granularity: "year",
      position: position++,
    });
  }

  return periods;
}

function rewriteRowReferences(formula: string, oldRowName: string, newRowName: string, periodLabels: string[]) {
  return periodLabels.reduce((current, label) => {
    const oldReference = `[${oldRowName} ${label}]`;
    const newReference = `[${newRowName} ${label}]`;
    return current.split(oldReference).join(newReference);
  }, formula);
}

export async function createProjectionModel(projectId: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const startDate = String(formData.get("start_date") ?? "");
  const horizonYears = Number(formData.get("horizon_years") ?? 0);
  const monthlyYears = Number(formData.get("monthly_years") ?? 1);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !Number.isInteger(horizonYears) || horizonYears < 1 || horizonYears > 10 || ![1, 2].includes(monthlyYears) || monthlyYears > horizonYears) {
    return { error: "Choose a valid date, a horizon between 1 and 10 years, and one or two monthly years." };
  }

  const { data: model, error } = await supabase
    .from("projection_models")
    .insert({ project_id: projectId, start_date: startDate, horizon_years: horizonYears, monthly_years: monthlyYears })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const { error: periodsError } = await supabase
    .from("projection_periods")
    .insert(buildPeriods(startDate, horizonYears, monthlyYears).map((period) => ({ ...period, model_id: model.id })));

  if (periodsError) return { error: periodsError.message };

  await logActivity(projectId, "projection_model_created", "Created a projection model.", {
    start_date: startDate,
    horizon_years: horizonYears,
    monthly_years: monthlyYears,
  });
  revalidatePath(`/projects/${projectId}`);
  return { id: model.id as string };
}

export async function getProjectionModel(projectId: string): Promise<ProjectionModelWithGrid | null> {
  await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projection_models")
    .select("*, projection_periods(*), projection_rows(*, projection_cells(*))")
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const model = data as unknown as ProjectionModelWithGrid;
  return {
    ...model,
    projection_periods: [...(model.projection_periods ?? [])].sort((a, b) => a.position - b.position),
    projection_rows: [...(model.projection_rows ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((row) => ({
        ...row,
        projection_cells: [...(row.projection_cells ?? [])],
      })),
  };
}

export async function addProjectionRow(
  projectId: string,
  modelId: string,
  name: string,
  rowKind: "section" | "input" | "calculated" | "summary" = "input",
  parentRowId: string | null = null,
  insertAtRowId?: string,
  placement: "above" | "below" = "below",
  formatBold = false,
  formatGapAfter = false,
) {
  await requireUser();
  const supabase = await createClient();
  const rowName = name.trim();
  if (!rowName) return { error: "A row name is required." };

  let lastRowQuery = supabase
    .from("projection_rows")
    .select("position")
    .eq("model_id", modelId)
    .order("position", { ascending: false })
    .limit(1);
  if (parentRowId) lastRowQuery = lastRowQuery.eq("parent_row_id", parentRowId);
  else lastRowQuery = lastRowQuery.is("parent_row_id", null);
  const { data: lastRow } = await lastRowQuery.maybeSingle();

  let position = (lastRow?.position ?? -1) + 1;
  if (insertAtRowId) {
    const { data: target } = await supabase
      .from("projection_rows")
      .select("id, model_id, parent_row_id, position")
      .eq("id", insertAtRowId)
      .maybeSingle();
    if (!target || target.model_id !== modelId || (target.parent_row_id ?? null) !== (parentRowId ?? null)) return { error: "That row is no longer available." };
    position = target.position + (placement === "below" ? 1 : 0);
    let followingQuery = supabase
      .from("projection_rows")
      .select("id, position")
      .eq("model_id", modelId)
      .gte("position", position)
      .order("position", { ascending: false });
    if (parentRowId) followingQuery = followingQuery.eq("parent_row_id", parentRowId);
    else followingQuery = followingQuery.is("parent_row_id", null);
    const { data: following } = await followingQuery;
    for (const row of following ?? []) {
      const { error: shiftError } = await supabase.from("projection_rows").update({ position: row.position + 1 }).eq("id", row.id);
      if (shiftError) return { error: shiftError.message };
    }
  }

  const { data, error } = await supabase
    .from("projection_rows")
    .insert({
      model_id: modelId,
      parent_row_id: parentRowId,
      name: rowName,
      row_kind: rowKind,
      position,
      format_bold: formatBold,
      format_gap_after: formatGapAfter,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  await logActivity(projectId, "projection_row_added", `Added the ${rowName} row to the projection.`);
  revalidatePath(`/projects/${projectId}`);
  return { id: data.id as string };
}

export async function deleteProjectionRow(projectId: string, rowId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("projection_rows")
    .select("name, projection_models!inner(project_id)")
    .eq("id", rowId)
    .maybeSingle();
  if (!row || (row.projection_models as unknown as { project_id: string }).project_id !== projectId) return { error: "That row is no longer available." };
  const { error } = await supabase.from("projection_rows").delete().eq("id", rowId);
  if (error) return { error: error.message };
  await logActivity(projectId, "projection_row_deleted", `Deleted the ${row.name} row from the projection.`);
  revalidatePath(`/projects/${projectId}/projection`);
  return {};
}

export async function updateProjectionRowFormat(
  projectId: string,
  rowId: string,
  format: { bold: boolean; fill: "muted" | "accent" | null; gapAfter: boolean },
) {
  await requireUser();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("projection_rows")
    .select("projection_models!inner(project_id)")
    .eq("id", rowId)
    .maybeSingle();
  if (!row || (row.projection_models as unknown as { project_id: string }).project_id !== projectId) return { error: "That row is no longer available." };
  const { error } = await supabase.from("projection_rows").update({ format_bold: format.bold, format_fill: format.fill, format_gap_after: format.gapAfter }).eq("id", rowId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/projection`);
  return {};
}

export async function updateProjectionRow(
  projectId: string,
  rowId: string,
  name: string,
  formatBold: boolean,
  formatGapAfter: boolean,
) {
  await requireUser();
  const rowName = name.trim();
  if (!rowName) return { error: "A row name is required." };
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("projection_rows")
    .select("name, model_id, projection_models!inner(project_id)")
    .eq("id", rowId)
    .maybeSingle();
  if (!row || (row.projection_models as unknown as { project_id: string }).project_id !== projectId) return { error: "That row is no longer available." };
  const { error } = await supabase.from("projection_rows").update({ name: rowName, format_bold: formatBold, format_gap_after: formatGapAfter }).eq("id", rowId);
  if (error) return { error: error.message };

  if (row.name !== rowName) {
    const { data: periods, error: periodsError } = await supabase
      .from("projection_periods")
      .select("label")
      .eq("model_id", row.model_id);
    if (periodsError) return { error: periodsError.message };

    const { data: modelRows, error: rowsError } = await supabase
      .from("projection_rows")
      .select("id")
      .eq("model_id", row.model_id);
    if (rowsError) return { error: rowsError.message };

    const rowIds = (modelRows ?? []).map((modelRow) => modelRow.id);
    if (rowIds.length) {
      const { data: formulaCells, error: formulasError } = await supabase
        .from("projection_cells")
        .select("id, formula_text")
        .in("row_id", rowIds)
        .not("formula_text", "is", null);
      if (formulasError) return { error: formulasError.message };

      const periodLabels = (periods ?? []).map((period) => period.label);
      for (const cell of formulaCells ?? []) {
        const formulaText = cell.formula_text ?? "";
        const nextFormula = rewriteRowReferences(formulaText, row.name, rowName, periodLabels);
        if (nextFormula === formulaText) continue;

        const { error: cellError } = await supabase
          .from("projection_cells")
          .update({ formula_text: nextFormula })
          .eq("id", cell.id);
        if (cellError) return { error: cellError.message };
      }
    }
  }

  revalidatePath(`/projects/${projectId}/projection`);
  return {};
}

export async function addProjectionYear(projectId: string, modelId: string) {
  await requireUser();
  const supabase = await createClient();
  const { data: model } = await supabase
    .from("projection_models")
    .select("start_date, horizon_years, monthly_years, project_id")
    .eq("id", modelId)
    .maybeSingle();
  if (!model || model.project_id !== projectId) return { error: "That projection is no longer available." };
  if (model.horizon_years >= 10) return { error: "A projection can include at most 10 years." };

  const nextHorizon = model.horizon_years + 1;
  const nextPeriods = buildPeriods(model.start_date, nextHorizon, model.monthly_years).map((period) => ({ ...period, model_id: modelId }));
  const { data: existing, error: existingError } = await supabase.from("projection_periods").select("period_start").eq("model_id", modelId);
  if (existingError) return { error: existingError.message };
  const starts = new Set(existing.map((period) => period.period_start));
  const additions = nextPeriods.filter((period) => !starts.has(period.period_start));
  const { error: periodsError } = await supabase.from("projection_periods").insert(additions);
  if (periodsError) return { error: periodsError.message };
  const { error: modelError } = await supabase.from("projection_models").update({ horizon_years: nextHorizon }).eq("id", modelId);
  if (modelError) return { error: modelError.message };
  await logActivity(projectId, "projection_column_added", "Added a year to the projection horizon.");
  revalidatePath(`/projects/${projectId}/projection`);
  return {};
}

export async function updateProjectionModelSettings(projectId: string, modelId: string, formData: FormData) {
  await requireUser();
  const startDate = String(formData.get("start_date") ?? "");
  const horizonYears = Number(formData.get("horizon_years") ?? 0);
  const monthlyYears = Number(formData.get("monthly_years") ?? 0);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !Number.isInteger(horizonYears) || horizonYears < 1 || horizonYears > 10 || ![1, 2].includes(monthlyYears) || monthlyYears > horizonYears) {
    return { error: "Choose a valid date, a horizon between 1 and 10 years, and one or two monthly years." };
  }

  const supabase = await createClient();
  const { data: model } = await supabase.from("projection_models").select("project_id, start_date, horizon_years, monthly_years").eq("id", modelId).maybeSingle();
  if (!model || model.project_id !== projectId) return { error: "That projection is no longer available." };
  if (horizonYears < model.horizon_years) return { error: "To protect entered data, a horizon can only be extended—not shortened." };

  const structureChanged = startDate !== model.start_date || monthlyYears !== model.monthly_years;
  if (structureChanged) {
    const { count } = await supabase.from("projection_cells").select("id", { count: "exact", head: true }).in("row_id", (await supabase.from("projection_rows").select("id").eq("model_id", modelId)).data?.map((row) => row.id) ?? []);
    if (count) return { error: "Change the start date or monthly detail before entering values. Existing cells would need to be rebuilt." };
    const { error: deleteError } = await supabase.from("projection_periods").delete().eq("model_id", modelId);
    if (deleteError) return { error: deleteError.message };
    const { error: periodsError } = await supabase.from("projection_periods").insert(buildPeriods(startDate, horizonYears, monthlyYears).map((period) => ({ ...period, model_id: modelId })));
    if (periodsError) return { error: periodsError.message };
  } else if (horizonYears > model.horizon_years) {
    const allPeriods = buildPeriods(startDate, horizonYears, monthlyYears).map((period) => ({ ...period, model_id: modelId }));
    const { data: existing } = await supabase.from("projection_periods").select("period_start").eq("model_id", modelId);
    const starts = new Set((existing ?? []).map((period) => period.period_start));
    const { error: periodsError } = await supabase.from("projection_periods").insert(allPeriods.filter((period) => !starts.has(period.period_start)));
    if (periodsError) return { error: periodsError.message };
  }

  const { error } = await supabase.from("projection_models").update({ start_date: startDate, horizon_years: horizonYears, monthly_years: monthlyYears }).eq("id", modelId);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}/projection`);
  return {};
}

export async function saveProjectionCell(
  projectId: string,
  rowId: string,
  periodId: string,
  rawValue: string,
) {
  await requireUser();
  const supabase = await createClient();
  const value = rawValue.trim();
  const { data: row, error: rowError } = await supabase
    .from("projection_rows")
    .select("model_id, projection_models!inner(project_id)")
    .eq("id", rowId)
    .maybeSingle();

  if (rowError || !row || (row.projection_models as unknown as { project_id: string }).project_id !== projectId) {
    return { error: "That row is no longer available." };
  }

  const { data: period, error: periodError } = await supabase
    .from("projection_periods")
    .select("model_id")
    .eq("id", periodId)
    .maybeSingle();

  if (periodError || !period || period.model_id !== row.model_id) {
    return { error: "That period is not part of this projection." };
  }

  if (!value) {
    const { error } = await supabase
      .from("projection_cells")
      .delete()
      .eq("row_id", rowId)
      .eq("period_id", periodId);
    if (error) return { error: error.message };
    revalidatePath(`/projects/${projectId}`);
    return {};
  }

  const formulaText = value.startsWith("=") ? value : null;
  const numericValue = formulaText ? null : Number(value.replace(/,/g, ""));
  if (!formulaText && !Number.isFinite(numericValue)) {
    return { error: "Enter a number or a formula beginning with =." };
  }

  const { error } = await supabase.from("projection_cells").upsert(
    {
      row_id: rowId,
      period_id: periodId,
      input_value: numericValue,
      formula_text: formulaText,
      calculated_value: null,
    },
    { onConflict: "row_id,period_id" },
  );
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return {};
}
