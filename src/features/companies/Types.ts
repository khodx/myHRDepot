// Matches the `public.companies` schema. There is no `is_active` column, so
// there is no `isActive` field or ACTIVE/INACTIVE status concept anywhere in
// the database. The columns beyond id/reference_id/company_name/audit fields
// are `industry`, `employee_count`, and `headquarters_location` (see this
// module's Database.sql for the full column list and RLS notes).
//
// Schemas.ts, Service.ts, the Components, and the Tests are consistent with
// this file. The audit_events field names used by Service.ts (`action_type`,
// `performed_by`, `summary`, `source_module`, `metadata`) are the correct
// column names per Database.sql — there is no `event_type`, `actor_id`, or
// `changes` column.

export type MhdCompanyId = string;
export type MhdCompanyReferenceId = `COMP-${string}`;

export interface MhdCompany {
  id: MhdCompanyId;
  referenceId: MhdCompanyReferenceId;
  companyName: string;
  industry: string | null;
  employeeCount: number | null;
  headquartersLocation: string | null;
  createdAt: string;
  // Nullable: the one platform-internal "SimplyHR" company row is
  // migration-seeded, not created through mhd_create_company, so it has no
  // real authenticated actor (see migration 0143 — previously an all-zero
  // UUID sentinel stood in for "no actor," which this null replaces).
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

export interface MhdCreateCompanyInput {
  companyName: string;
  industry?: string | null;
  employeeCount?: number | null;
  headquartersLocation?: string | null;
}

export interface MhdUpdateCompanyInput {
  companyName: string;
  industry?: string | null;
  employeeCount?: number | null;
  headquartersLocation?: string | null;
}

export interface MhdCompanyListFilters {
  searchTerm: string;
}
