// Aligned to the `public.companies` schema (see Database.sql / Types.ts).
// There is no `is_active` column, so there is no `isActive` field, no
// STATUS_CHANGE audit action, and no ACTIVE/INACTIVE list filter.
//
// `createCompany`/`updateCompany` go through mhd_create_company /
// mhd_update_company (migration 0136) rather than a direct client-side
// insert/update + a separate audit_events insert. Two client-side writes
// meant a failed audit insert left the company mutation committed but the
// caller seeing a generic failure — a silent partial-success/failure
// mismatch (2026-08-06 audit finding M7). Both RPCs write the company row
// and its audit_events row inside one function call, so they succeed or
// fail together. `companies.reference_id` is still populated by the
// existing DB trigger either way (see Database.sql).

import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdCompany,
  MhdCompanyListFilters,
  MhdCreateCompanyInput,
  MhdUpdateCompanyInput,
} from './Types';

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

  async createCompany(input: MhdCreateCompanyInput): Promise<MhdCompany> {
    // gen:types drops `null` from these defaulted RPC arguments even though
    // mhd_create_company accepts it at runtime (same gen:types limitation
    // documented in features/forms/Service.ts), hence `as never`.
    const { data, error } = await supabaseClient
      .rpc('mhd_create_company', {
        p_company_name: input.companyName.trim(),
        p_industry: input.industry ?? null,
        p_employee_count: input.employeeCount ?? null,
        p_headquarters_location: input.headquartersLocation ?? null,
      } as never)
      .returns<MhdCompanyRow[]>();

    if (error) {
      throw new Error(`Unable to create company: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create company: no record returned.');
    }

    return mapCompanyRow(row);
  },

  async updateCompany(companyId: string, input: MhdUpdateCompanyInput): Promise<MhdCompany> {
    const { data, error } = await supabaseClient
      .rpc('mhd_update_company', {
        p_company_id: companyId,
        p_company_name: input.companyName.trim(),
        p_industry: input.industry ?? null,
        p_employee_count: input.employeeCount ?? null,
        p_headquarters_location: input.headquartersLocation ?? null,
      } as never)
      .returns<MhdCompanyRow[]>();

    if (error) {
      throw new Error(`Unable to update company: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to update company: no record returned.');
    }

    return mapCompanyRow(row);
  },
};
