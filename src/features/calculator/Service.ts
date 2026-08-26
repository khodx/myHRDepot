import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import type {
  MhdCalculatorInputField, MhdCalculatorTemplate, MhdCalculatorTemplateFilters,
  MhdCalculatorTemplateRpcRow, MhdCreateCalculatorTemplateInput,
  MhdSetCalculatorTemplateActiveInput, MhdUpdateCalculatorTemplateInput,
} from './Types';

function narrowFields(value: unknown): MhdCalculatorInputField[] {
  // The column is jsonb, so the Supabase client normally hands back a
  // parsed array already. JSON.parse only runs if a driver/edge path ever
  // returns the raw string form -- narrowFields stays defensive either way.
  if (typeof value === 'string') {
    try {
      return narrowFields(JSON.parse(value) as unknown);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value.filter((field): field is MhdCalculatorInputField => {
    if (!field || typeof field !== 'object') return false;
    const candidate = field as Record<string, unknown>;
    return (
      typeof candidate.key === 'string' &&
      typeof candidate.label === 'string' &&
      typeof candidate.type === 'string' &&
      typeof candidate.required === 'boolean'
    );
  });
}

function mapTemplate(row: MhdCalculatorTemplateRpcRow): MhdCalculatorTemplate {
  return {
    id: row.id,
    templateKey: row.template_key,
    category: row.category,
    title: row.title,
    description: row.description,
    icon: row.icon,
    inputFields: narrowFields(row.input_fields),
    formula: row.formula,
    resultLabel: row.result_label,
    resultUnit: row.result_unit,
    resultDecimals: row.result_decimals,
    version: row.version,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Contract-only access, mirroring the Training Catalog convention: every
// method below calls `.rpc()` and nothing else. `calculator_templates` has a
// `using(false) with check(false)` no-direct-write RLS policy, so all
// mutation must go through these security-definer RPCs.
export const mhdCalculatorService = {
  async listTemplates(filters: MhdCalculatorTemplateFilters = {}): Promise<MhdCalculatorTemplate[]> {
    const { data, error } = await supabaseClient.rpc('mhd_calculator_template_list', {
      p_include_inactive: filters.includeInactive ?? false,
    });
    if (error) throw error;
    return (data ?? []).map((row) => mapTemplate(row as MhdCalculatorTemplateRpcRow));
  },

  async createTemplate(input: MhdCreateCalculatorTemplateInput): Promise<MhdCalculatorTemplate> {
    const { data, error } = await supabaseClient.rpc('mhd_calculator_template_create', {
      p_template_key: input.templateKey.trim(),
      p_category: input.category,
      p_title: input.title.trim(),
      p_description: input.description.trim(),
      p_icon: input.icon.trim(),
      p_input_fields: input.inputFields as unknown as Json,
      p_formula: input.formula,
      p_result_label: input.resultLabel.trim(),
      p_result_unit: input.resultUnit ?? undefined,
      p_result_decimals: input.resultDecimals ?? 2,
    });
    if (error) throw error;
    const row = (data ?? [])[0];
    if (!row) throw new Error('Calculator template creation returned no row.');
    return mapTemplate(row as MhdCalculatorTemplateRpcRow);
  },

  async updateTemplate(input: MhdUpdateCalculatorTemplateInput): Promise<MhdCalculatorTemplate> {
    const { data, error } = await supabaseClient.rpc('mhd_calculator_template_update', {
      p_template_id: input.templateId,
      p_category: input.category ?? undefined,
      p_title: input.title ?? undefined,
      p_description: input.description ?? undefined,
      p_icon: input.icon ?? undefined,
      p_input_fields: (input.inputFields ?? undefined) as unknown as Json | undefined,
      p_formula: input.formula ?? undefined,
      p_result_label: input.resultLabel ?? undefined,
      p_result_unit: input.resultUnit ?? undefined,
      p_result_decimals: input.resultDecimals ?? undefined,
    });
    if (error) throw error;
    const row = (data ?? [])[0];
    if (!row) throw new Error('Calculator template update returned no row.');
    return mapTemplate(row as MhdCalculatorTemplateRpcRow);
  },

  async setTemplateActive(input: MhdSetCalculatorTemplateActiveInput): Promise<MhdCalculatorTemplate> {
    const { data, error } = await supabaseClient.rpc('mhd_calculator_template_set_active', {
      p_template_id: input.templateId,
      p_is_active: input.isActive,
    });
    if (error) throw error;
    const row = (data ?? [])[0];
    if (!row) throw new Error('Calculator template activation returned no row.');
    return mapTemplate(row as MhdCalculatorTemplateRpcRow);
  },
};
