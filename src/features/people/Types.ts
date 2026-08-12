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
