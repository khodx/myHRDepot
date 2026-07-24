// Aligned to the `public.companies` schema (see Database.sql / Types.ts).
// There is no `is_active` column, so there is no `isActive` field, no
// STATUS_CHANGE audit action, and no ACTIVE/INACTIVE list filter. The
// audit_events insert includes the required `company_id` column (see
// Database.sql's `audit_events` column list) and uses `industry` /
// `employeeCount` / `headquartersLocation` in its metadata.
//
// `companies.reference_id` is populated by a trigger (see Database.sql), so
// `createCompany` below succeeds via a direct client-side insert.

import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Database } from '@/types/database.types';
import type {
  MhdCompany,
  MhdCompanyListFilters,
  MhdCompanyMutationContext,
  MhdCreateCompanyInput,
  MhdUpdateCompanyInput,
} from './Types';

type MhdCompanyInsert = Database['public']['Tables']['companies']['Insert'];

type MhdCompanyRow = {
  id: string;
  reference_id: string;
  company_name: string;
  industry: string | null;
  employee_count: number | null;
  headquarters_location: string | null;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};

function mapCompanyRow(row: MhdCompanyRow): MhdCompany {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdCompany['referenceId'],
    companyName: row.company_name,
    industry: row.industry,
    employeeCount: row.employee_count,
    headquartersLocation: row.headquarters_location,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

async function insertCompanyAuditEvent(
  company: MhdCompany,
  actionType: 'CREATE' | 'UPDATE',
  actorUserId: string,
) {
  const summary =
    actionType === 'CREATE'
      ? `Company created: ${company.companyName}`
      : `Company updated: ${company.companyName}`;

  const { error } = await supabaseClient.from('audit_events').insert({
    company_id: company.id,
    entity_type: 'COMPANY',
    entity_id: company.id,
    action_type: actionType,
    summary,
    performed_by: actorUserId,
    source_module: 'COMPANY_MODULE',
    metadata: {
      company_id: company.id,
      company_reference_id: company.referenceId,
      company_name: company.companyName,
      industry: company.industry,
      employee_count: company.employeeCount,
      headquarters_location: company.headquartersLocation,
    },
  });

  if (error) {
    throw new Error(`Company audit failed: ${error.message}`);
  }
}

export const mhdCompanyService = {
  async listCompanies(filters: MhdCompanyListFilters): Promise<MhdCompany[]> {
    let query = supabaseClient
      .from('companies')
      .select('*')
      .order('company_name', { ascending: true });

    if (filters.searchTerm.trim().length > 0) {
      const searchTerm = filters.searchTerm.trim().replaceAll('%', '').replaceAll('_', '');
      query = query.ilike('company_name', `%${searchTerm}%`);
    }

    const { data, error } = await query.returns<MhdCompanyRow[]>();

    if (error) {
      throw new Error(`Unable to load companies: ${error.message}`);
    }

    return (data ?? []).map(mapCompanyRow);
  },

  async getCompanyById(companyId: string): Promise<MhdCompany> {
    const { data, error } = await supabaseClient
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single<MhdCompanyRow>();

    if (error) {
      throw new Error(`Unable to load company: ${error.message}`);
    }

    return mapCompanyRow(data);
  },

  async createCompany(
    input: MhdCreateCompanyInput,
    context: MhdCompanyMutationContext,
  ): Promise<MhdCompany> {
    // `reference_id` is required in the generated Insert type but is
    // populated by a database trigger, so it is intentionally omitted here
    // (hence the double assertion) — see Database.sql for the trigger.
    const insertPayload = {
      company_name: input.companyName.trim(),
      industry: input.industry ?? null,
      employee_count: input.employeeCount ?? null,
      headquarters_location: input.headquartersLocation ?? null,
      created_by: context.actorUserId,
      updated_by: context.actorUserId,
    } as Omit<MhdCompanyInsert, 'reference_id'> as MhdCompanyInsert;

    const { data, error } = await supabaseClient
      .from('companies')
      .insert(insertPayload)
      .select('*')
      .single<MhdCompanyRow>();

    if (error) {
      throw new Error(`Unable to create company: ${error.message}`);
    }

    const company = mapCompanyRow(data);
    await insertCompanyAuditEvent(company, 'CREATE', context.actorUserId);
    return company;
  },

  async updateCompany(
    companyId: string,
    input: MhdUpdateCompanyInput,
    context: MhdCompanyMutationContext,
  ): Promise<MhdCompany> {
    const { data, error } = await supabaseClient
      .from('companies')
      .update({
        company_name: input.companyName.trim(),
        industry: input.industry ?? null,
        employee_count: input.employeeCount ?? null,
        headquarters_location: input.headquartersLocation ?? null,
        updated_by: context.actorUserId,
      })
      .eq('id', companyId)
      .select('*')
      .single<MhdCompanyRow>();

    if (error) {
      throw new Error(`Unable to update company: ${error.message}`);
    }

    const company = mapCompanyRow(data);
    await insertCompanyAuditEvent(company, 'UPDATE', context.actorUserId);
    return company;
  },
};
