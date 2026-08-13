import type { MhdCompanyId } from '@/features/companies/Types';

// `public.people` has no email/phone/mobile columns — per the locked
// TBL-004 spec, `people` only carries identity fields. Contact data
// (EMAIL/PHONE/MOBILE) lives in the locked TBL-005 `public.contact_methods`
// table, one row per contact method, with an `is_primary` flag.
// `people.id`/`people.company_id` are Postgres `uuid`.
export type MhdPersonId = string;
export type MhdPersonReferenceId = `PERS-${string}`;

export type MhdContactMethodId = string;
export type MhdContactMethodReferenceId = `CONT-${string}`;
export type MhdContactType = 'EMAIL' | 'PHONE' | 'MOBILE';
export type MhdContactEntityType = 'PERSON';

export interface MhdContactMethod {
  id: MhdContactMethodId;
  referenceId: MhdContactMethodReferenceId;
  entityType: MhdContactEntityType;
  entityId: string;
  contactType: MhdContactType;
  contactValue: string;
  isPrimary: boolean;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

// `primaryEmail`/`primaryPhone`/`primaryMobile` are convenience projections
// returned by `mhd_get_person_by_id` / `mhd_list_people_directory` — they are
// NOT columns on `people`. They are resolved via a LEFT JOIN LATERAL against
// `contact_methods` (one query, no N+1) picking the row where
// `is_primary = true` for that contact_type. A person may have zero, one, or
// several contact methods of each type; only the primary one is projected
// here. Use `mhd_list_contact_methods_for_person` to see the full set.
export interface MhdPerson {
  id: MhdPersonId;
  referenceId: MhdPersonReferenceId;
  companyId: MhdCompanyId;
  companyName: string | null;
  managerId?: MhdPersonId | null;
  managerDisplayName?: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  preferredName: string | null;
  displayName: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  primaryMobile: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type MhdPersonEmploymentStateName =
  | 'APPLICANT'
  | 'CANDIDATE'
  | 'PRE_HIRE'
  | 'ACTIVE'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'SEPARATED';

// From mhd_person_current_employment_state — the person's open
// (effective_to is null) employment-state row, or null if they've never had
// one. `effectiveFrom` is the anchor date for tenure display: the codebase's
// existing tenure aggregate (mhd_dashboard_company_summary's
// avg_tenure_years) uses this same "current open ACTIVE row's effective_from"
// as the hire-date proxy — `people` itself deliberately carries no hire date.
export interface MhdPersonEmploymentState {
  id: string;
  referenceId: string;
  companyId: MhdCompanyId;
  personId: MhdPersonId;
  state: MhdPersonEmploymentStateName;
  effectiveFrom: string;
  reason: string | null;
  sourceModule: string | null;
  sourceEntityType: string | null;
  sourceEntityId: string | null;
}

export interface MhdDirectReport {
  personId: MhdPersonId;
  referenceId: MhdPersonReferenceId;
  displayName: string;
  jobTitle: string | null;
}

export interface MhdOrgChartNode extends MhdDirectReport {
  managerId: MhdPersonId | null;
  companyId: MhdCompanyId;
  children: MhdOrgChartNode[];
}

// `email`/`phone`/`mobile` here are an ergonomic convenience, not `people`
// columns: `mhd_create_person`/`mhd_update_person` accept them as optional
// params and write them through to `contact_methods` as the PRIMARY row of
// that contact_type (see Service.ts / Database.sql for the exact upsert
// semantics on update). Leave blank to skip; on update, an explicit empty
// string clears (deletes) the existing primary contact method of that type.
export interface MhdCreatePersonInput {
  companyId: MhdCompanyId;
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phone: string;
  mobile?: string;
  managerId?: MhdPersonId | null;
}

export interface MhdUpdatePersonInput extends MhdCreatePersonInput {
  personId: MhdPersonId;
  mobile: string;
}

export interface MhdPeopleListFilters {
  companyId: MhdCompanyId | 'ALL';
  searchTerm: string;
}

export interface MhdPersonMutationContext {
  actorUserId: string;
}

export interface MhdAddContactMethodInput {
  personId: MhdPersonId;
  contactType: MhdContactType;
  contactValue: string;
  isPrimary?: boolean;
}

export interface MhdUpdateContactMethodInput {
  contactMethodId: MhdContactMethodId;
  contactValue?: string;
  isPrimary?: boolean;
}
