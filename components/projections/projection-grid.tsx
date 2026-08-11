"use client";

import { useRouter } from "next/navigation";
import { type FocusEvent, type KeyboardEvent, useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addProjectionRow, addProjectionYear, deleteProjectionRow, saveProjectionCell, updateProjectionRow } from "@/lib/actions/projection-model";
import type {
  ProjectionAssumption,
  ProjectionModelWithGrid,
  ProjectionPeriod,
  ProjectionRowWithCells,
} from "@/lib/types/database";

type CellKey = `${string}:${string}`;
type Selection = { rowId: string; periodId: string };

function cellKey(rowId: string, periodId: string): CellKey {
  return `${rowId}:${periodId}`;
}

function numericAssumptions(assumptions: ProjectionAssumption[]) {
  const values: Record<string, number> = {};
  assumptions
    .filter((assumption) => assumption.assumption_type !== "text")
    .forEach((assumption) => {
      const value = Number(assumption.value.replace(/,/g, "")) / (assumption.assumption_type === "percentage" ? 100 : 1);
      if (!Number.isFinite(value)) return;
      values[assumption.name.toLowerCase()] = value;
      values[assumption.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")] = value;
    });
  return values;
}

function displayAssumptionValue(assumption: ProjectionAssumption) {
  if (assumption.assumption_type === "percentage") return `${assumption.value}%`;
  if (assumption.assumption_type === "currency") return `$${assumption.value}`;
  return assumption.value;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function periodYear(period: ProjectionPeriod) {
  return new Date(`${period.period_start}T00:00:00`).getUTCFullYear();
}

function isSummaryPeriod(period: ProjectionPeriod) {
  return period.label.endsWith(" Total");
}

function periodEmphasis(period: ProjectionPeriod) {
  return period.granularity === "month"
    ? "border-l"
    : "border-l-2 border-foreground/20 bg-muted/20 font-bold";
}

// This deliberately supports only arithmetic and named @assumption references.
// Keeping the grammar narrow avoids executing formulas as JavaScript in the browser.
function calculateFormula(
  formula: string,
  assumptionValues: Record<string, number>,
  referenceValues: Record<string, number>,
) {
  let expression = formula.slice(1)
    .replace(/\[([^\]]+)\]/g, (_, reference: string) => {
      const value = referenceValues[reference.toLowerCase()];
      return value === undefined ? "NaN" : String(value);
    })
    .replace(/@\{([^}]+)\}/g, (_, name: string) => {
      const value = assumptionValues[name.toLowerCase()];
      return value === undefined ? "NaN" : String(value);
    })
    .replace(/@([a-zA-Z0-9_]+)/g, (_, name: string) => {
    const value = assumptionValues[name.toLowerCase()];
    return value === undefined ? "NaN" : String(value);
  });
  expression = expression.replace(/SUM\(([^()]+)\)/gi, (_, rawArgs: string) => {
    const total = rawArgs.split(",").reduce((sum, rawArg) => {
      const value = Number(rawArg.trim());
      return Number.isFinite(value) ? sum + value : NaN;
    }, 0);
    return Number.isFinite(total) ? String(total) : "NaN";
  });
  const compact = expression.replace(/\s+/g, "");
  const tokens = compact.match(/\d*\.\d+|\d+|[()+\-*/]/g);
  if (!tokens || tokens.join("") !== compact) return null;
  let index = 0;
  const factor = (): number => {
    const token = tokens[index++];
    if (token === "(") {
      const result = sum();
      if (tokens[index++] !== ")") throw new Error("Missing parenthesis");
      return result;
    }
    if (token === "-") return -factor();
    const result = Number(token);
    if (!Number.isFinite(result)) throw new Error("Invalid number");
    return result;
  };
  const product = (): number => {
    let result = factor();
    while (tokens[index] === "*" || tokens[index] === "/") {
      const operator = tokens[index++];
      const next = factor();
      result = operator === "*" ? result * next : result / next;
    }
    return result;
  };
  const sum = (): number => {
    let result = product();
    while (tokens[index] === "+" || tokens[index] === "-") {
      const operator = tokens[index++];
      const next = product();
      result = operator === "+" ? result + next : result - next;
    }
    return result;
  };
  try {
    const result = sum();
    return index === tokens.length && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

function formatValue(
  value: string,
  formula: string | null,
  assumptions: Record<string, number>,
  references: Record<string, number>,
) {
  if (formula) {
    const calculated = calculateFormula(formula, assumptions, references);
    return calculated === null ? "#ERROR" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(calculated);
  }
  if (!value) return "";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(numeric) : value;
}

export function ProjectionGrid({
  projectId,
  model,
  assumptions,
}: {
  projectId: string;
  model: ProjectionModelWithGrid;
  assumptions: ProjectionAssumption[];
}) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [editingCell, setEditingCell] = useState<CellKey | null>(null);
  const [drafts, setDrafts] = useState<Record<CellKey, string>>({});
  const [newRowName, setNewRowName] = useState("");
  const [newRowKind, setNewRowKind] = useState<"input" | "section">("input");
  const [newRowBold, setNewRowBold] = useState(false);
  const [newRowGapAfter, setNewRowGapAfter] = useState(false);
  const [editingRow, setEditingRow] = useState<{ id: string; name: string; bold: boolean; gapAfter: boolean } | null>(null);
  const [formulaBarFocused, setFormulaBarFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const cellRefs = useRef<Record<CellKey, HTMLInputElement | null>>({});
  const rowLabelRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const formulaBarRef = useRef<HTMLInputElement>(null);
  const formulaCaret = useRef(0);
  const assumptionValues = useMemo(() => numericAssumptions(assumptions), [assumptions]);
  const cellValues = useMemo(() => {
    const values: Record<CellKey, { value: string; formula: string | null }> = {};
    model.projection_rows.forEach((row) => row.projection_cells.forEach((cell) => {
      values[cellKey(row.id, cell.period_id)] = {
        value: cell.input_value ?? "",
        formula: cell.formula_text,
      };
    }));
    return values;
  }, [model]);
  const referenceValues = useMemo(() => {
    const references: Record<string, number> = {};
    const evaluating = new Set<CellKey>();
    const calculateCell = (row: ProjectionRowWithCells, period: ProjectionPeriod): number | null => {
      if (isSummaryPeriod(period)) {
        return model.projection_periods
          .filter((candidate) => candidate.granularity === "month" && periodYear(candidate) === periodYear(period))
          .reduce((total, monthPeriod) => {
            const result = calculateCell(row, monthPeriod);
            return result === null ? total : total + result;
          }, 0);
      }

      const key = cellKey(row.id, period.id);
      if (evaluating.has(key)) return null;
      const stored = cellValues[key];
      const currentValue = stringValue(drafts[key] ?? stored?.formula ?? stored?.value);
      if (!currentValue) return 0;
      if (!currentValue.trimStart().startsWith("=")) {
        const numeric = Number(currentValue);
        return Number.isFinite(numeric) ? numeric : null;
      }
      evaluating.add(key);
      const lookup: Record<string, number> = {};
      model.projection_rows.forEach((referenceRow) => model.projection_periods.forEach((referencePeriod) => {
        const result = calculateCell(referenceRow, referencePeriod);
        if (result !== null) lookup[`${referenceRow.name} ${referencePeriod.label}`.toLowerCase()] = result;
      }));
      const calculated = calculateFormula(currentValue.trimStart(), assumptionValues, lookup);
      evaluating.delete(key);
      return calculated;
    };
    model.projection_rows.forEach((row) => model.projection_periods.forEach((period) => {
      const result = calculateCell(row, period);
      if (result !== null) references[`${row.name} ${period.label}`.toLowerCase()] = result;
    }));
    return references;
  }, [assumptionValues, cellValues, drafts, model.projection_periods, model.projection_rows]);

  const selectedKey = selection ? cellKey(selection.rowId, selection.periodId) : null;
  const selectedStored = selectedKey ? cellValues[selectedKey] : undefined;
  const formulaValue = selectedKey
    ? stringValue(drafts[selectedKey] ?? selectedStored?.formula ?? selectedStored?.value)
    : "";
  const selectedRow = selection ? model.projection_rows.find((row) => row.id === selection.rowId) : undefined;
  const selectedPeriod = selection ? model.projection_periods.find((period) => period.id === selection.periodId) : undefined;
  const selectedReference = selectedRow && selectedPeriod
    ? `${selectedRow.name} ${selectedPeriod.label}`
    : "Select a cell";
  const gridTemplateColumns = `220px repeat(${model.projection_periods.length}, minmax(2.875rem, 1fr))`;
  const typedAssumption = formulaValue.match(/@([a-z0-9_ ]*)$/i)?.[1];
  const matchingAssumptions = typedAssumption === undefined ? [] : assumptions.filter((assumption) => {
    if (assumption.assumption_type === "text") return false;
    const token = assumption.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    return token.startsWith(typedAssumption.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
  });
  const inputRows = model.projection_rows.filter((row) => row.row_kind !== "section");

  function setCellDraft(rowId: string, periodId: string, value: string) {
    setDrafts((current) => ({ ...current, [cellKey(rowId, periodId)]: value }));
  }

  function persistCell(rowId: string, periodId: string, value: string) {
    startTransition(async () => {
      const result = await saveProjectionCell(projectId, rowId, periodId, value);
      if (result.error) return setError(result.error);
      setError(null);
      setDrafts((current) => {
        const next = { ...current };
        delete next[cellKey(rowId, periodId)];
        return next;
      });
      router.refresh();
    });
  }

  function insertReference(row: ProjectionRowWithCells, period: ProjectionPeriod) {
    if (!selection || (selection.rowId === row.id && selection.periodId === period.id)) return;
    const current = drafts[cellKey(selection.rowId, selection.periodId)] ?? formulaValue;
    const reference = `[${row.name} ${period.label}]`;
    const caret = Math.min(formulaCaret.current, current.length);
    const nextValue = `${current.slice(0, caret)}${reference}${current.slice(caret)}`;
    setCellDraft(selection.rowId, selection.periodId, nextValue);
    const nextCaret = caret + reference.length;
    formulaCaret.current = nextCaret;
    requestAnimationFrame(() => {
      formulaBarRef.current?.focus();
      formulaBarRef.current?.setSelectionRange(nextCaret, nextCaret);
    });
  }

  function insertAssumption(assumption: ProjectionAssumption) {
    if (!selection || assumption.assumption_type === "text") return;
    const token = `@{${assumption.name}}`;
    setCellDraft(selection.rowId, selection.periodId, formulaValue.replace(/@[a-z0-9_ ]*$/i, token));
  }

  function focusCell(rowIndex: number, periodIndex: number) {
    const row = inputRows[rowIndex];
    const period = model.projection_periods[periodIndex];
    if (!row || !period) return false;
    cellRefs.current[cellKey(row.id, period.id)]?.focus();
    return true;
  }

  function focusRowLabel(rowIndex: number) {
    const row = model.projection_rows[rowIndex];
    if (!row) return false;
    rowLabelRefs.current[row.id]?.focus();
    return true;
  }

  function handleRowLabelKeyDown(event: KeyboardEvent<HTMLButtonElement>, row: ProjectionRowWithCells) {
    const rowIndex = model.projection_rows.findIndex((candidate) => candidate.id === row.id);
    if (event.key === "ArrowUp") { event.preventDefault(); focusRowLabel(rowIndex - 1); }
    if (event.key === "ArrowDown") { event.preventDefault(); focusRowLabel(rowIndex + 1); }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      const inputIndex = inputRows.findIndex((candidate) => candidate.id === row.id);
      if (inputIndex >= 0) focusCell(inputIndex, 0);
    }
  }

  function clearSelection() {
    setSelection(null);
    setEditingCell(null);
    if (selectedKey) cellRefs.current[selectedKey]?.blur();
  }

  function insertRow(row: ProjectionRowWithCells, placement: "above" | "below") {
    startTransition(async () => {
      const result = await addProjectionRow(projectId, model.id, "New line item", "input", row.parent_row_id, row.id, placement);
      if (result.error) setError(result.error);
      else if (!result.id) setError("The row was created, but the editor could not find it.");
      else {
        setError(null);
        setEditingRow({ id: result.id, name: "New line item", bold: false, gapAfter: false });
        router.refresh();
      }
    });
  }

  function removeRow(row: ProjectionRowWithCells) {
    startTransition(async () => {
      const result = await deleteProjectionRow(projectId, row.id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function saveRowEdit() {
    if (!editingRow) return;
    startTransition(async () => {
      const result = await updateProjectionRow(projectId, editingRow.id, editingRow.name, editingRow.bold, editingRow.gapAfter);
      if (result.error) setError(result.error);
      else {
        setEditingRow(null);
        router.refresh();
      }
    });
  }

  function handleRowEditBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
    saveRowEdit();
  }

  function handleRowEditKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveRowEdit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setEditingRow(null);
    }
  }

  function inputForCell(row: ProjectionRowWithCells, period: ProjectionPeriod) {
    const key = cellKey(row.id, period.id);
    const isSelected = selectedKey === key;
    const rowIndex = inputRows.findIndex((inputRow) => inputRow.id === row.id);
    const periodIndex = model.projection_periods.findIndex((projectionPeriod) => projectionPeriod.id === period.id);

    if (isSummaryPeriod(period)) {
      const reference = `${row.name} ${period.label}`.toLowerCase();
      const display = formatValue(String(referenceValues[reference] ?? 0), null, assumptionValues, referenceValues);
      return (
        <button
          type="button"
          aria-label={`${row.name} ${period.label}${isSelected ? ", active cell" : ""}`}
          className={`flex h-11 w-full min-w-[2.875rem] items-center justify-end px-1 text-right font-mono text-sm font-bold outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${periodEmphasis(period)} ${isSelected ? "bg-primary/10 ring-2 ring-inset ring-primary" : ""}`}
          onMouseDown={(event) => {
            if (selection && !isSelected && formulaBarFocused && formulaValue.trimStart().startsWith("=")) {
              event.preventDefault();
              insertReference(row, period);
            }
          }}
          onFocus={() => {
            setSelection({ rowId: row.id, periodId: period.id });
            setEditingCell(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "ArrowDown") {
              event.preventDefault();
              if (!focusCell(rowIndex + 1, periodIndex)) clearSelection();
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              if (!focusCell(rowIndex, periodIndex - 1)) rowLabelRefs.current[row.id]?.focus();
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              if (!focusCell(rowIndex, periodIndex + 1)) clearSelection();
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              if (!focusCell(rowIndex - 1, periodIndex)) clearSelection();
            }
          }}
        >
          {display}
        </button>
      );
    }

    const stored = cellValues[key];
    const draft = drafts[key];
    const value = stringValue(draft ?? stored?.formula ?? stored?.value);
    const isFormula = value.trimStart().startsWith("=");
    const display = formatValue(
      isFormula ? "" : value,
      isFormula ? value.trimStart() : null,
      assumptionValues,
      referenceValues,
    );
    return (
      <input
        ref={(element) => { cellRefs.current[key] = element; }}
        aria-label={`${row.name} ${period.label}${isSelected ? ", active cell" : ""}`}
        value={editingCell === key ? value : display}
        onMouseDown={(event) => {
          if (selection && !isSelected && formulaBarFocused && formulaValue.trimStart().startsWith("=")) {
            event.preventDefault();
            insertReference(row, period);
          }
        }}
        onFocus={() => {
          setSelection({ rowId: row.id, periodId: period.id });
          setEditingCell(key);
        }}
        onChange={(event) => setCellDraft(row.id, period.id, event.target.value)}
        onBlur={(event) => {
          setEditingCell(null);
          persistCell(row.id, period.id, event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            if (!focusCell(rowIndex + 1, periodIndex)) clearSelection();
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            if (!focusCell(rowIndex, periodIndex - 1)) rowLabelRefs.current[row.id]?.focus();
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            if (!focusCell(rowIndex, periodIndex + 1)) clearSelection();
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            if (!focusCell(rowIndex - 1, periodIndex)) clearSelection();
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            if (!focusCell(rowIndex + 1, periodIndex)) clearSelection();
          }
        }}
        className={`h-11 w-full min-w-[2.875rem] px-1 text-right font-mono text-sm outline-none focus:ring-2 focus:ring-inset focus:ring-primary ${row.format_bold || period.granularity === "year" ? "font-bold" : ""} ${periodEmphasis(period)} ${isSelected ? "bg-primary/10 ring-2 ring-inset ring-primary" : "bg-transparent"}`}
      />
    );
  }

  function deleteRowButton(row: ProjectionRowWithCells) {
    return (
      <button
        type="button"
        aria-label={`Delete ${row.name}`}
        className="group/delete absolute left-1 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full bg-destructive text-sm text-destructive-foreground"
        onClick={() => removeRow(row)}
      >
        ×
        <span className="pointer-events-none absolute left-7 top-1/2 z-10 hidden -translate-y-1/2 whitespace-nowrap rounded bg-destructive px-2 py-1 text-xs font-medium normal-case tracking-normal text-destructive-foreground shadow-sm group-hover/delete:block group-focus-visible/delete:block">
          Delete row
        </span>
      </button>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="shrink-0 border-b bg-muted/30 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded border bg-background px-2 py-1 font-mono text-sm text-muted-foreground">
            {selectedReference}
          </span>
          <span className="sr-only" aria-live="polite">
            Active cell: {selectedReference}
          </span>
          <div className="relative min-w-64 flex-1">
            <Input
              ref={formulaBarRef}
              aria-label="Formula bar"
              value={formulaValue}
              placeholder="Enter a number or formula, e.g. =1000 * (1 + @annual_growth_rate)"
              disabled={!selection}
              onChange={(event) => {
                formulaCaret.current = event.target.selectionStart ?? event.target.value.length;
                if (selection) setCellDraft(selection.rowId, selection.periodId, event.target.value);
              }}
              onFocus={(event) => {
                formulaCaret.current = event.target.selectionStart ?? event.target.value.length;
                setFormulaBarFocused(true);
              }}
              onSelect={(event) => { formulaCaret.current = event.currentTarget.selectionStart ?? formulaValue.length; }}
              onKeyUp={(event) => { formulaCaret.current = event.currentTarget.selectionStart ?? formulaValue.length; }}
              onBlur={() => setFormulaBarFocused(false)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && selection) persistCell(selection.rowId, selection.periodId, event.currentTarget.value);
              }}
            />
            {typedAssumption !== undefined ? (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
                {matchingAssumptions.length ? matchingAssumptions
                  .map((assumption) => (
                    <button
                      className="flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm hover:bg-accent"
                      key={assumption.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => insertAssumption(assumption)}
                    >
                      <span>{assumption.name}</span>
                      <span className="text-xs text-muted-foreground">{displayAssumptionValue(assumption)}</span>
                    </button>
                  )) : <p className="px-3 py-2 text-sm text-muted-foreground">No matching numeric assumptions.</p>}
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Type <code>@</code> in a formula to choose an assumption. With the formula bar focused, click another cell to insert a reference like <code>[Sales Aug 2026]</code>.
        </p>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          <div
            className="sticky top-0 z-30 grid border-b bg-muted/40 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns }}
          >
            <div className="sticky left-0 z-40 bg-muted p-3 shadow-[4px_0_8px_-8px_currentColor]">
              Row label
            </div>
            {model.projection_periods.map((period, index) => (
              <div
                className={`${periodEmphasis(period)} group relative p-3 text-right`}
                key={period.id}
              >
                {period.label}
                {index === model.projection_periods.length - 1 ? <button type="button" className="pointer-events-none absolute inset-y-0 right-1 my-auto h-6 rounded px-1 text-base leading-none text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground group-hover:pointer-events-auto group-hover:opacity-100 focus:pointer-events-auto focus:opacity-100" aria-label="Add a year" disabled={isPending || model.horizon_years >= 10} onClick={() => startTransition(async () => { const result = await addProjectionYear(projectId, model.id); if (result.error) setError(result.error); else router.refresh(); })}>+</button> : null}
              </div>
            ))}
          </div>
          {model.projection_rows.map((row, rowIndex) => row.row_kind === "section" ? (
            <div
              className={`group relative mb-3 grid bg-background text-[1.2em] font-bold text-foreground ${model.projection_rows[rowIndex - 1]?.format_gap_after ?? false ? "border-t" : ""}`}
              key={row.id}
              style={{ gridTemplateColumns }}
            >
              <div className={`sticky left-0 z-20 flex items-center bg-background px-3 py-3 shadow-[4px_0_8px_-8px_currentColor] hover:z-40 focus-within:z-40 group-hover:z-40 ${editingRow?.id === row.id ? "pl-9" : ""}`}>
                {editingRow?.id === row.id ? <div className="flex w-full items-center gap-2 normal-case" onBlur={handleRowEditBlur} onKeyDown={handleRowEditKeyDown}><Input autoFocus value={editingRow.name} onChange={(event) => setEditingRow({ ...editingRow, name: event.target.value })} className="h-8 min-w-0 flex-1" /><button type="button" className={`rounded px-1 ${editingRow.bold ? "bg-foreground text-background" : ""}`} onClick={() => setEditingRow({ ...editingRow, bold: !editingRow.bold })}>B</button><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={editingRow.gapAfter ?? false} onChange={(event) => setEditingRow({ ...editingRow, gapAfter: event.target.checked })} />Gap</label></div> : <button ref={(element) => { rowLabelRefs.current[row.id] = element; }} type="button" className="min-w-0 flex-1 truncate text-left" onKeyDown={(event) => handleRowLabelKeyDown(event, row)} onClick={() => setEditingRow({ id: row.id, name: row.name, bold: row.format_bold, gapAfter: row.format_gap_after ?? false })}>{row.name}</button>}
                {editingRow?.id === row.id ? deleteRowButton(row) : null}
                <button type="button" aria-label={`Add row below ${row.name}`} className="absolute -bottom-3 left-0 z-50 h-6 w-full opacity-0 hover:opacity-100 focus:opacity-100" onClick={() => insertRow(row, "below")}><span className="absolute left-0 right-0 top-1/2 border-t border-green-600" /><span className="absolute left-1/2 top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-green-600 text-sm text-white shadow-sm">+</span></button>
              </div>
              <div className="bg-background" style={{ gridColumn: "2 / -1" }} />
            </div>
          ) : (
            <div className={`grid border-b ${model.projection_rows[rowIndex - 1]?.format_gap_after ?? false ? "border-t" : ""} ${row.format_gap_after ?? false ? "mb-3" : ""} ${row.format_fill === "muted" ? "bg-muted/40" : row.format_fill === "accent" ? "bg-primary/10" : ""}`} key={row.id} style={{ gridTemplateColumns }}>
              <div className={`group relative sticky left-0 z-20 flex items-center px-3 py-0 text-sm shadow-[4px_0_8px_-8px_currentColor] hover:z-40 focus-within:z-40 ${editingRow?.id === row.id ? "pl-9" : ""} ${row.format_fill === "muted" ? "bg-muted" : row.format_fill === "accent" ? "bg-primary/10" : "bg-card"} ${row.format_bold ? "font-bold" : "font-medium"}`}>{editingRow?.id === row.id ? <div className="flex w-full items-center gap-2" onBlur={handleRowEditBlur} onKeyDown={handleRowEditKeyDown}><Input autoFocus value={editingRow.name} onChange={(event) => setEditingRow({ ...editingRow, name: event.target.value })} className="h-8 min-w-0 flex-1" /><button type="button" className={`rounded px-1 ${editingRow.bold ? "bg-foreground text-background" : ""}`} onClick={() => setEditingRow({ ...editingRow, bold: !editingRow.bold })}>B</button><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={editingRow.gapAfter ?? false} onChange={(event) => setEditingRow({ ...editingRow, gapAfter: event.target.checked })} />Gap</label></div> : <button ref={(element) => { rowLabelRefs.current[row.id] = element; }} type="button" className="min-w-0 flex-1 truncate text-left" onKeyDown={(event) => handleRowLabelKeyDown(event, row)} onClick={() => setEditingRow({ id: row.id, name: row.name, bold: row.format_bold, gapAfter: row.format_gap_after ?? false })}>{row.name}</button>}{editingRow?.id === row.id ? deleteRowButton(row) : null}<button type="button" aria-label={`Add row below ${row.name}`} className="absolute -bottom-3 left-0 z-50 h-6 w-full opacity-0 hover:opacity-100 focus:opacity-100" onClick={() => insertRow(row, "below")}><span className="absolute left-0 right-0 top-1/2 border-t border-green-600" /><span className="absolute left-1/2 top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-green-600 text-sm text-white shadow-sm">+</span></button></div>
              {model.projection_periods.map((period) => <div key={period.id}>{inputForCell(row, period)}</div>)}
            </div>
          ))}
        </div>
      </div>
      <form
        className="flex shrink-0 flex-wrap gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            const result = await addProjectionRow(projectId, model.id, newRowName, newRowKind, null, undefined, "below", newRowBold, newRowGapAfter);
            if (result.error) return setError(result.error);
            if (!result.id) return setError("The row was created, but the editor could not find it.");
            setEditingRow({ id: result.id, name: newRowName.trim(), bold: newRowBold, gapAfter: newRowGapAfter });
            setNewRowName("");
            setNewRowGapAfter(false);
            setError(null);
            router.refresh();
          });
        }}
      >
        <Input value={newRowName} onChange={(event) => setNewRowName(event.target.value)} placeholder={newRowKind === "section" ? "Heading name" : "New line item"} className="max-w-xs" />
        <select className="h-9 rounded-md border border-input bg-transparent px-2 text-sm" value={newRowKind} onChange={(event) => setNewRowKind(event.target.value as "input" | "section")}><option value="input">Line item</option><option value="section">Heading only</option></select>
        <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={newRowBold} onChange={(event) => setNewRowBold(event.target.checked)} />Bold</label>
        <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={newRowGapAfter} onChange={(event) => setNewRowGapAfter(event.target.checked)} />Gap after</label>
        <Button type="submit" variant="ghost" disabled={isPending}>+ Add</Button>
        {error ? <p className="self-center text-sm text-destructive">{error}</p> : null}
      </form>
    </section>
  );
}
