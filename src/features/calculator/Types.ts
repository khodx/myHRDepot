export interface MhdCalculatorTemplateRpcRow {
  id: string;
  template_key: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  input_fields: unknown;
  formula: string;
  result_label: string;
  result_unit: string | null;
  result_decimals: number;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type MhdCalculatorFieldType = 'number' | 'currency' | 'percent' | 'integer' | 'select';

export interface MhdCalculatorFieldOption { value: string; label: string }

export interface MhdCalculatorInputField {
  key: string;
  label: string;
  type: MhdCalculatorFieldType;
  required: boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  helpText?: string;
  options?: MhdCalculatorFieldOption[];
  defaultValue?: number | string;
}

export type MhdCalculatorResultUnit = 'currency' | 'percent' | 'hours' | 'number' | string;

export interface MhdCalculatorTemplate {
  id: string;
  templateKey: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  inputFields: MhdCalculatorInputField[];
  formula: string;
  resultLabel: string;
  resultUnit: MhdCalculatorResultUnit | null;
  resultDecimals: number;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MhdCalculatorTemplateFilters { includeInactive?: boolean }

export interface MhdCreateCalculatorTemplateInput {
  templateKey: string;
  category: string;
  title: string;
  description: string;
  icon: string;
  inputFields: MhdCalculatorInputField[];
  formula: string;
  resultLabel: string;
  resultUnit?: string | null;
  resultDecimals?: number;
}

export interface MhdUpdateCalculatorTemplateInput {
  templateId: string;
  category?: string | null;
  title?: string | null;
  description?: string | null;
  icon?: string | null;
  inputFields?: MhdCalculatorInputField[] | null;
  formula?: string | null;
  resultLabel?: string | null;
  resultUnit?: string | null;
  resultDecimals?: number | null;
}

export interface MhdSetCalculatorTemplateActiveInput {
  templateId: string;
  isActive: boolean;
}

export const MHD_CALCULATOR_CATEGORIES = [
  'Pay & Wages',
  'Deductions & Withholding',
  'Proration & Time',
  'Percentages & Ratios',
  'Splitting & Averaging',
  'Business & Finance',
  'Benefits & Time Off',
] as const;
