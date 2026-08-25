import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdI9RevealFieldKey,
  MhdPersonI9Identity,
  MhdPersonW4Withholding,
  MhdUpsertPersonI9IdentityInput,
  MhdUpsertPersonW4WithholdingInput,
} from './Types';

type MhdI9IdentityRow = {
  id: string;
  person_id: string;
  has_ssn: boolean;
  date_of_birth: string | null;
  mailing_address_street: string | null;
  mailing_address_apt: string | null;
  mailing_address_city: string | null;
  mailing_address_state: string | null;
  mailing_address_zip: string | null;
  citizenship_status: string;
  has_lawful_permanent_resident_number: boolean;
  has_alien_uscis_number: boolean;
  has_alien_i94_number: boolean;
  has_alien_foreign_passport_number: boolean;
  alien_foreign_passport_country: string | null;
  alien_work_authorized_until: string | null;
  updated_at: string | null;
};

type MhdW4WithholdingRow = {
  id: string;
  person_id: string;
  tax_year: number;
  filing_status: string;
  multiple_jobs_checkbox: boolean;
  qualifying_children_count: number;
  other_dependents_count: number;
  other_credits_amount: number;
  other_income_amount: number;
  deductions_amount: number;
  extra_withholding_amount: number;
  exempt_from_withholding: boolean;
  updated_at: string | null;
};

function mapI9IdentityRow(row: MhdI9IdentityRow): MhdPersonI9Identity {
  return {
    id: row.id,
    personId: row.person_id,
    hasSsn: row.has_ssn,
    dateOfBirth: row.date_of_birth,
    mailingAddressStreet: row.mailing_address_street,
    mailingAddressApt: row.mailing_address_apt,
    mailingAddressCity: row.mailing_address_city,
    mailingAddressState: row.mailing_address_state,
    mailingAddressZip: row.mailing_address_zip,
    citizenshipStatus: row.citizenship_status as MhdPersonI9Identity['citizenshipStatus'],
    hasLawfulPermanentResidentNumber: row.has_lawful_permanent_resident_number,
    hasAlienUscisNumber: row.has_alien_uscis_number,
    hasAlienI94Number: row.has_alien_i94_number,
    hasAlienForeignPassportNumber: row.has_alien_foreign_passport_number,
    alienForeignPassportCountry: row.alien_foreign_passport_country,
    alienWorkAuthorizedUntil: row.alien_work_authorized_until,
    updatedAt: row.updated_at,
  };
}

function mapW4WithholdingRow(row: MhdW4WithholdingRow): MhdPersonW4Withholding {
  return {
    id: row.id,
    personId: row.person_id,
    taxYear: row.tax_year,
    filingStatus: row.filing_status as MhdPersonW4Withholding['filingStatus'],
    multipleJobsCheckbox: row.multiple_jobs_checkbox,
    qualifyingChildrenCount: row.qualifying_children_count,
    otherDependentsCount: row.other_dependents_count,
    otherCreditsAmount: Number(row.other_credits_amount),
    otherIncomeAmount: Number(row.other_income_amount),
    deductionsAmount: Number(row.deductions_amount),
    extraWithholdingAmount: Number(row.extra_withholding_amount),
    exemptFromWithholding: row.exempt_from_withholding,
    updatedAt: row.updated_at,
  };
}

export const mhdPersonTaxIdentityService = {
  async getI9Identity(personId: string): Promise<MhdPersonI9Identity | null> {
    const { data, error } = await supabaseClient
      .rpc('mhd_person_i9_identity_get', { p_person_id: personId })
      .returns<MhdI9IdentityRow[]>();
    if (error) throw new Error(`Unable to load I-9 identity data: ${error.message}`);
    const row = data?.[0];
    return row ? mapI9IdentityRow(row) : null;
  },

  async upsertI9Identity(input: MhdUpsertPersonI9IdentityInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_person_i9_identity_upsert', {
      p_person_id: input.personId,
      p_ssn: input.ssn ?? undefined,
      p_date_of_birth: input.dateOfBirth ?? undefined,
      p_mailing_address_street: input.mailingAddressStreet ?? undefined,
      p_mailing_address_apt: input.mailingAddressApt ?? undefined,
      p_mailing_address_city: input.mailingAddressCity ?? undefined,
      p_mailing_address_state: input.mailingAddressState ?? undefined,
      p_mailing_address_zip: input.mailingAddressZip ?? undefined,
      p_citizenship_status: input.citizenshipStatus,
      p_lawful_permanent_resident_number: input.lawfulPermanentResidentNumber ?? undefined,
      p_alien_uscis_number: input.alienUscisNumber ?? undefined,
      p_alien_i94_number: input.alienI94Number ?? undefined,
      p_alien_foreign_passport_number: input.alienForeignPassportNumber ?? undefined,
      p_alien_foreign_passport_country: input.alienForeignPassportCountry ?? undefined,
      p_alien_work_authorized_until: input.alienWorkAuthorizedUntil ?? undefined,
    });
    if (error) throw new Error(`Unable to save I-9 identity data: ${error.message}`);
    return data as string;
  },

  /** Platform Admin / HR Partner only. Every call is audited. Never used for form prefill. */
  async revealI9IdentityField(personId: string, fieldKey: MhdI9RevealFieldKey): Promise<string | null> {
    const { data, error } = await supabaseClient.rpc('mhd_person_i9_identity_reveal_field', {
      p_person_id: personId,
      p_field_key: fieldKey,
    });
    if (error) throw new Error(`Unable to reveal I-9 identity field: ${error.message}`);
    return (data as string | null) ?? null;
  },

  async getW4Withholding(personId: string, taxYear?: number): Promise<MhdPersonW4Withholding | null> {
    const { data, error } = await supabaseClient
      .rpc('mhd_person_w4_withholding_get', {
        p_person_id: personId,
        p_tax_year: taxYear ?? undefined,
      })
      .returns<MhdW4WithholdingRow[]>();
    if (error) throw new Error(`Unable to load W-4 withholding data: ${error.message}`);
    const row = data?.[0];
    return row ? mapW4WithholdingRow(row) : null;
  },

  async upsertW4Withholding(input: MhdUpsertPersonW4WithholdingInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_person_w4_withholding_upsert', {
      p_person_id: input.personId,
      p_tax_year: input.taxYear,
      p_filing_status: input.filingStatus,
      p_multiple_jobs_checkbox: input.multipleJobsCheckbox,
      p_qualifying_children_count: input.qualifyingChildrenCount,
      p_other_dependents_count: input.otherDependentsCount,
      p_other_credits_amount: input.otherCreditsAmount,
      p_other_income_amount: input.otherIncomeAmount,
      p_deductions_amount: input.deductionsAmount,
      p_extra_withholding_amount: input.extraWithholdingAmount,
      p_exempt_from_withholding: input.exemptFromWithholding,
    });
    if (error) throw new Error(`Unable to save W-4 withholding data: ${error.message}`);
    return data as string;
  },
};
