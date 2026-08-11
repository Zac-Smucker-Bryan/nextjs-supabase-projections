export type ProjectType =
  | "general"
  | "sales_forecast"
  | "income_statement"
  | "balance_sheet"
  | "cash_flow";

export type Collection = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  owner_id: string;
  collection_id: string | null;
  name: string;
  description: string | null;
  project_type: ProjectType;
  created_at: string;
  updated_at: string;
};

export type ActivityEvent = {
  id: string;
  project_id: string;
  user_id: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AssumptionType = "number" | "percentage" | "currency" | "text";

export type ProjectionAssumption = {
  id: string;
  project_id: string;
  name: string;
  value: string;
  assumption_type: AssumptionType;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectionAssumptionWithProject = ProjectionAssumption & {
  project: Pick<Project, "id" | "name">;
};

export type ActivityEventWithProject = ActivityEvent & {
  project: Pick<Project, "id" | "name">;
};

export type ProjectionVersion = {
  id: string;
  project_id: string;
  version_name: string;
  notes: string | null;
  created_by: string;
  created_at: string;
};

export type ProjectionPeriod = {
  id: string;
  model_id: string;
  period_start: string;
  period_end: string;
  label: string;
  granularity: "month" | "year";
  position: number;
};

export type ProjectionModel = {
  id: string;
  project_id: string;
  start_date: string;
  horizon_years: number;
  monthly_years: number;
  currency_code: string;
  created_at: string;
  updated_at: string;
};

export type ProjectionRow = {
  id: string;
  model_id: string;
  parent_row_id: string | null;
  name: string;
  row_kind: "section" | "input" | "calculated" | "summary";
  position: number;
  format_bold: boolean;
  format_fill: "muted" | "accent" | null;
  format_gap_after: boolean;
};

export type ProjectionCell = {
  id: string;
  row_id: string;
  period_id: string;
  input_value: string | null;
  formula_text: string | null;
  calculated_value: string | null;
  updated_at: string;
};

export type ProjectionRowWithCells = ProjectionRow & {
  projection_cells: ProjectionCell[];
};

export type ProjectionModelWithGrid = ProjectionModel & {
  projection_periods: ProjectionPeriod[];
  projection_rows: ProjectionRowWithCells[];
};

export type AssumptionApplication = {
  id: string;
  assumption_id: string;
  model_id: string;
  row_id: string | null;
  start_period_id: string | null;
  end_period_id: string | null;
};

export type CollectionWithProjects = Collection & {
  projects: Pick<
    Project,
    "id" | "name" | "description" | "project_type" | "created_at" | "updated_at"
  >[];
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  general: "General",
  sales_forecast: "Sales forecast",
  income_statement: "Income statement",
  balance_sheet: "Balance sheet",
  cash_flow: "Cash flow",
};

export const ASSUMPTION_TYPE_LABELS: Record<AssumptionType, string> = {
  number: "Number",
  percentage: "Percentage",
  currency: "Currency",
  text: "Text",
};
