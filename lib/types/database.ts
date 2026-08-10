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

export type ProjectionVersion = {
  id: string;
  project_id: string;
  version_name: string;
  notes: string | null;
  created_by: string;
  created_at: string;
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
