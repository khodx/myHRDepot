import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAddContactMethodInput,
  MhdContactMethod,
  MhdCreatePersonInput,
  MhdPeopleListFilters,
  MhdPerson,
  MhdPersonMutationContext,
  MhdUpdateContactMethodInput,
  MhdUpdatePersonInput,
} from './Types';

type MhdPersonDirectoryRow = {
  id: string;
  reference_id: string;
  company_id: string;
  company_name: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  preferred_name: string | null;
  display_name: string;
  primary_email: string | null;
  primary_phone: string | null;
  primary_mobile: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};

// Returned by mhd_create_person / mhd_update_person, which do not join
// company_name (see Database.sql for why the return shapes differ).
type MhdPersonMutationRow = Omit<MhdPersonDirectoryRow, 'company_name'>;

type MhdContactMethodRow = {
  id: string;
  reference_id: string;
  entity_type: 'PERSON';
  entity_id: string;
  contact_type: 'EMAIL' | 'PHONE' | 'MOBILE';
  contact_value: string;
  is_primary: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
};

function mapPersonRow(row: MhdPersonDirectoryRow | MhdPersonMutationRow): MhdPerson {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdPerson['referenceId'],
    companyId: row.company_id,
    companyName: 'company_name' in row ? row.company_name : null,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    displayName: row.display_name,
    primaryEmail: row.primary_email,
    primaryPhone: row.primary_phone,
    primaryMobile: row.primary_mobile,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function mapContactMethodRow(row: MhdContactMethodRow): MhdContactMethod {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdContactMethod['referenceId'],
    entityType: row.entity_type,
    entityId: row.entity_id,
    contactType: row.contact_type,
    contactValue: row.contact_value,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

// RPC args are typed optional (`p_x?: string`) in the generated
// database.types.ts — omitted args fall back to their SQL default of NULL, so
// blank strings become `undefined` (omitted) rather than `null` here.
function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const mhdPersonService = {
  async getPersonById(personId: string): Promise<MhdPerson> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_person_by_id', { p_person_id: personId })
      .returns<MhdPersonDirectoryRow[]>();

    if (error) {
      throw new Error(`Unable to load person: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error(`Person not found: ${personId}`);
    }

    return mapPersonRow(row);
  },

  async listPeople(filters: MhdPeopleListFilters): Promise<MhdPerson[]> {
    const companyId = filters.companyId === 'ALL' ? undefined : filters.companyId;
    const searchTerm = filters.searchTerm.trim().length > 0 ? filters.searchTerm.trim() : undefined;

    const { data, error } = await supabaseClient
      .rpc('mhd_list_people_directory', {
        p_company_id: companyId,
        p_search_term: searchTerm,
      })
      .returns<MhdPersonDirectoryRow[]>();

    if (error) {
      throw new Error(`Unable to load people: ${error.message}`);
    }

    return (data ?? []).map(mapPersonRow);
  },

  async createPerson(input: MhdCreatePersonInput, context: MhdPersonMutationContext): Promise<MhdPerson> {
    // `people` has no email/phone/mobile columns (locked TBL-004 spec).
    // p_email/p_phone/p_mobile are an ergonomic convenience on
    // mhd_create_person: when non-blank, the function writes them through to
    // `contact_methods` as PRIMARY rows of that contact_type, in the same
    // transaction as the person insert. Leave blank to create a person with
    // no contact methods yet.
    const { data, error } = await supabaseClient
      .rpc('mhd_create_person', {
        p_company_id: input.companyId,
        p_first_name: input.firstName.trim(),
        p_middle_name: normalizeOptionalText(input.middleName),
        p_last_name: input.lastName.trim(),
        p_preferred_name: normalizeOptionalText(input.preferredName),
        p_email: normalizeOptionalText(input.email),
        p_phone: normalizeOptionalText(input.phone),
        p_mobile: normalizeOptionalText(input.mobile),
        p_actor_user_id: context.actorUserId,
      })
      .returns<MhdPersonMutationRow[]>();

    if (error) {
      throw new Error(`Unable to create person: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create person: no record returned.');
    }

    return mapPersonRow(row);
  },

  async updatePerson(input: MhdUpdatePersonInput, context: MhdPersonMutationContext): Promise<MhdPerson> {
    // Same convenience semantics as createPerson, plus: on update, passing an
    // explicit empty string for email/phone/mobile DELETES the existing
    // primary contact method of that type (rather than leaving it
    // untouched). Passing a non-blank value UPSERTs the primary row (updates
    // it if one exists, otherwise inserts a new primary). This mirrors what
    // a "single email field" UI expects while the underlying storage is a
    // one-to-many contact_methods table. For anything beyond "the one
    // primary email/phone/mobile" (secondary emails, multiple phone numbers,
    // promoting a non-primary to primary, etc.) use the dedicated
    // addContactMethod / updateContactMethod / deleteContactMethod /
    // listContactMethodsForPerson calls below.
    const { data, error } = await supabaseClient
      .rpc('mhd_update_person', {
        p_person_id: input.personId,
        p_company_id: input.companyId,
        p_first_name: input.firstName.trim(),
        p_middle_name: normalizeOptionalText(input.middleName),
        p_last_name: input.lastName.trim(),
        p_preferred_name: normalizeOptionalText(input.preferredName),
        p_email: input.email.trim().length > 0 ? input.email.trim() : '',
        p_phone: input.phone.trim().length > 0 ? input.phone.trim() : '',
        p_mobile: input.mobile.trim().length > 0 ? input.mobile.trim() : '',
        p_actor_user_id: context.actorUserId,
      })
      .returns<MhdPersonMutationRow[]>();

    if (error) {
      throw new Error(`Unable to update person: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to update person: no record returned.');
    }

    return mapPersonRow(row);
  },

  async listContactMethodsForPerson(personId: string): Promise<MhdContactMethod[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_contact_methods_for_person', { p_person_id: personId })
      .returns<MhdContactMethodRow[]>();

    if (error) {
      throw new Error(`Unable to load contact methods: ${error.message}`);
    }

    return (data ?? []).map(mapContactMethodRow);
  },

  async addContactMethod(input: MhdAddContactMethodInput): Promise<MhdContactMethod> {
    const { data, error } = await supabaseClient
      .rpc('mhd_add_contact_method', {
        p_entity_id: input.personId,
        p_contact_type: input.contactType,
        p_contact_value: input.contactValue.trim(),
        p_is_primary: input.isPrimary ?? false,
        p_entity_type: 'PERSON',
      })
      .returns<MhdContactMethodRow[]>();

    if (error) {
      throw new Error(`Unable to add contact method: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to add contact method: no record returned.');
    }

    return mapContactMethodRow(row);
  },

  async updateContactMethod(input: MhdUpdateContactMethodInput): Promise<MhdContactMethod> {
    const { data, error } = await supabaseClient
      .rpc('mhd_update_contact_method', {
        p_contact_method_id: input.contactMethodId,
        p_contact_value: input.contactValue !== undefined ? input.contactValue.trim() : undefined,
        p_is_primary: input.isPrimary ?? undefined,
      })
      .returns<MhdContactMethodRow[]>();

    if (error) {
      throw new Error(`Unable to update contact method: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to update contact method: no record returned.');
    }

    return mapContactMethodRow(row);
  },

  async deleteContactMethod(contactMethodId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_contact_method', {
      p_contact_method_id: contactMethodId,
    });

    if (error) {
      throw new Error(`Unable to delete contact method: ${error.message}`);
    }
  },
};
