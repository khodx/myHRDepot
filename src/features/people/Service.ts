import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAddContactMethodInput,
  MhdContactMethod,
  MhdCreatePersonInput,
  MhdDirectReport,
  MhdOrgChartNode,
  MhdPeopleListFilters,
  MhdPerson,
  MhdPersonEmploymentState,
  MhdPersonMutationContext,
  MhdUpdateContactMethodInput,
  MhdUpdatePersonInput,
} from './Types';

type MhdPersonDirectoryRow = {
  id: string;
  reference_id: string;
  company_id: string;
  company_name: string | null;
  manager_id?: string | null;
  manager_display_name?: string | null;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  preferred_name: string | null;
  display_name: string;
  // Only mhd_get_person_by_id returns this today — mhd_list_people_directory
  // does not (see 0156_person_photos.sql design note 6: one signed URL per
  // list row is a separate batch-signing problem, deliberately deferred).
  photo_path?: string | null;
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

type MhdDirectReportRow = {
  person_id: string;
  reference_id: string;
  display_name: string;
  job_title: string | null;
};

type MhdOrgChartRow = MhdDirectReportRow & {
  manager_id: string | null;
  company_id: string;
};

type MhdPersonEmploymentStateRow = {
  id: string;
  reference_id: string;
  company_id: string;
  person_id: string;
  state: string;
  effective_from: string;
  reason: string | null;
  source_module: string | null;
  source_entity_type: string | null;
  source_entity_id: string | null;
};

function mapPersonEmploymentStateRow(row: MhdPersonEmploymentStateRow): MhdPersonEmploymentState {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    personId: row.person_id,
    state: row.state as MhdPersonEmploymentState['state'],
    effectiveFrom: row.effective_from,
    reason: row.reason,
    sourceModule: row.source_module,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
  };
}

function mapPersonRow(row: MhdPersonDirectoryRow | MhdPersonMutationRow): MhdPerson {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdPerson['referenceId'],
    companyId: row.company_id,
    companyName: 'company_name' in row ? row.company_name : null,
    managerId: row.manager_id ?? null,
    managerDisplayName: row.manager_display_name ?? null,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    displayName: row.display_name,
    photoPath: 'photo_path' in row ? (row.photo_path ?? null) : null,
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

function mapDirectReportRow(row: MhdDirectReportRow): MhdDirectReport {
  return {
    personId: row.person_id,
    referenceId: row.reference_id as MhdDirectReport['referenceId'],
    displayName: row.display_name,
    jobTitle: row.job_title,
  };
}

function mapOrgChartRow(row: MhdOrgChartRow): MhdOrgChartNode {
  return {
    ...mapDirectReportRow(row),
    managerId: row.manager_id,
    companyId: row.company_id,
    children: [],
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

  async listDirectReports(personId: string): Promise<MhdDirectReport[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_direct_reports', { p_person_id: personId })
      .returns<MhdDirectReportRow[]>();

    if (error) {
      throw new Error(`Unable to load direct reports: ${error.message}`);
    }

    return (data ?? []).map(mapDirectReportRow);
  },

  async listOrgChart(companyId: string | null): Promise<MhdOrgChartNode[]> {
    const { data, error } = await supabaseClient
      // gen:types omits null from p_company_id even though
      // mhd_list_people_org_chart accepts null to mean "all visible companies."
      .rpc('mhd_list_people_org_chart', { p_company_id: companyId } as never)
      .returns<MhdOrgChartRow[]>();

    if (error) {
      throw new Error(`Unable to load org chart: ${error.message}`);
    }

    return (data ?? []).map(mapOrgChartRow);
  },

  async createPerson(
    input: MhdCreatePersonInput,
    context: MhdPersonMutationContext,
  ): Promise<MhdPerson> {
    // `people` has no email/phone/mobile columns (locked TBL-004 spec).
    // p_email/p_phone/p_mobile are an ergonomic convenience on
    // mhd_create_person: when non-blank, the function writes them through to
    // `contact_methods` as PRIMARY rows of that contact_type, in the same
    // transaction as the person insert. Leave blank to create a person with
    // no contact methods yet.
    const rpcArgs = {
      p_company_id: input.companyId,
      p_first_name: input.firstName.trim(),
      p_middle_name: normalizeOptionalText(input.middleName),
      p_last_name: input.lastName.trim(),
      p_preferred_name: normalizeOptionalText(input.preferredName),
      p_email: normalizeOptionalText(input.email),
      p_phone: normalizeOptionalText(input.phone),
      p_mobile: normalizeOptionalText(input.mobile ?? ''),
      p_actor_user_id: context.actorUserId,
      p_manager_id: input.managerId ?? null,
    };

    const { data, error } = await supabaseClient
      // gen:types omits null from defaulted RPC arguments even though
      // mhd_create_person accepts p_manager_id = null ("no manager") at runtime.
      .rpc('mhd_create_person', rpcArgs as never)
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

  async updatePerson(
    input: MhdUpdatePersonInput,
    context: MhdPersonMutationContext,
  ): Promise<MhdPerson> {
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
    const rpcArgs = {
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
      p_manager_id: input.managerId ?? null,
    };

    const { data, error } = await supabaseClient
      // Same gen:types gap as createPerson above — p_manager_id = null is a
      // valid "clear the manager" value at runtime.
      .rpc('mhd_update_person', rpcArgs as never)
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

  /** The person's open (effective_to is null) employment-state row, or null
   *  if they've never had one — see mhd_person_current_employment_state. */
  async getCurrentEmploymentState(personId: string): Promise<MhdPersonEmploymentState | null> {
    const { data, error } = await supabaseClient
      .rpc('mhd_person_current_employment_state', { p_person_id: personId })
      .returns<MhdPersonEmploymentStateRow[]>();

    if (error) {
      throw new Error(`Unable to load employment state: ${error.message}`);
    }

    const row = data?.[0];
    return row ? mapPersonEmploymentStateRow(row) : null;
  },

  /** Uploads to the private person-photos bucket, then links it via
   *  mhd_set_person_photo (the sole write path — see 0156_person_photos.sql).
   *  Deletes `previousPhotoPath`'s object afterward so replacing a photo
   *  doesn't leave the old one orphaned in storage. */
  async uploadPersonPhoto({
    personId,
    companyId,
    file,
    previousPhotoPath,
  }: {
    personId: string;
    companyId: string;
    file: File;
    previousPhotoPath?: string | null;
  }): Promise<string> {
    const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : 'jpg';
    const path = `${companyId}/${personId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('person-photos')
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      throw new Error(`Unable to upload photo: ${uploadError.message}`);
    }

    const { data, error } = await supabaseClient
      .rpc('mhd_set_person_photo', { p_person_id: personId, p_photo_path: path })
      .returns<{ id: string; photo_path: string | null; updated_at: string; updated_by: string }[]>();

    if (error) {
      // The upload succeeded but linking it failed — remove the now-orphaned
      // object rather than leaving a dangling file nothing points to.
      await supabaseClient.storage.from('person-photos').remove([path]);
      throw new Error(`Unable to save photo: ${error.message}`);
    }

    const newPath = data?.[0]?.photo_path ?? path;
    if (previousPhotoPath && previousPhotoPath !== newPath) {
      await supabaseClient.storage.from('person-photos').remove([previousPhotoPath]);
    }

    return newPath;
  },

  async removePersonPhoto(personId: string, currentPhotoPath: string | null): Promise<void> {
    const { error } = await supabaseClient
      // mhd_set_person_photo's p_photo_path has no SQL default, so gen:types
      // omits null even though the RPC treats it as "clear the photo" — same
      // gap as p_manager_id elsewhere in this Service.
      .rpc('mhd_set_person_photo', { p_person_id: personId, p_photo_path: null } as never)
      .returns<{ id: string; photo_path: string | null; updated_at: string; updated_by: string }[]>();

    if (error) {
      throw new Error(`Unable to remove photo: ${error.message}`);
    }

    if (currentPhotoPath) {
      await supabaseClient.storage.from('person-photos').remove([currentPhotoPath]);
    }
  },

  /** Signs a person-photos object path into a viewable URL. The bucket is
   *  private, so this is the only way to render one (see 0156_person_photos.sql).
   *  Returns null on any failure (deleted object, expired access, etc.) —
   *  callers should fall back to initials, the same as a null photoPath. */
  async getPersonPhotoSignedUrl(photoPath: string): Promise<string | null> {
    const { data, error } = await supabaseClient.storage
      .from('person-photos')
      .createSignedUrl(photoPath, 3600);

    if (error) {
      return null;
    }

    return data?.signedUrl ?? null;
  },
};
