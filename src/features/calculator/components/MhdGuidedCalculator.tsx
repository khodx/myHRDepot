import { useMemo, useState } from 'react';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdEvaluateFormula } from '../formulaEngine';
import {
  mhdAppendCalculatorHistoryEntry,
  type MhdCalculatorHistoryEntry,
} from '../historyStore';
import { useMhdCalculatorTemplates } from '../Hook';
import {
  MHD_CALCULATOR_CATEGORIES,
  type MhdCalculatorInputField,
  type MhdCalculatorTemplate,
} from '../Types';
import { MhdCalculatorHistory } from './MhdCalculatorHistory';
import { MhdCalculatorIcon } from '../iconRegistry';

function formatResult(value: number, unit: string | null, decimals: number): string {
  const fractionDigits = Math.max(0, decimals);
  if (unit === 'currency') {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency: 'USD', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits,
    }).format(value);
  }
  const formatted = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits,
  }).format(value);
  if (unit === 'percent') return `${formatted}%`;
  return unit && unit !== 'number' ? `${formatted} ${unit}` : formatted;
}

function initialValues(template: MhdCalculatorTemplate | null): Record<string, string> {
  if (!template) return {};
  return Object.fromEntries(template.inputFields.map((field) => [field.key, field.defaultValue === undefined ? '' : String(field.defaultValue)]));
}

function fieldType(field: MhdCalculatorInputField): 'number' | 'select' {
  return field.type === 'select' ? 'select' : 'number';
}

export function MhdGuidedCalculator() {
  const { authUserId } = useMhdAuth();
  const templatesQuery = useMhdCalculatorTemplates({ includeInactive: false });
  const [search, setSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MhdCalculatorTemplate | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ label: string; value: string } | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const groupedTemplates = useMemo(() => {
    const templates = templatesQuery.data ?? [];
    const query = search.trim().toLocaleLowerCase();
    const matching = templates.filter((template) => `${template.title} ${template.description}`.toLocaleLowerCase().includes(query));
    return MHD_CALCULATOR_CATEGORIES.map((category) => ({
      category,
      templates: matching.filter((template) => template.category === category),
    })).filter((group) => group.templates.length > 0);
  }, [search, templatesQuery.data]);

  function selectTemplate(template: MhdCalculatorTemplate) {
    setSelectedTemplate(template);
    setValues(initialValues(template));
    setFieldErrors({});
    setError(null);
    setResult(null);
  }

  function updateValue(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: '' }));
    setError(null);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTemplate) return;
    const nextErrors: Record<string, string> = {};
    const numericValues: Record<string, number> = {};
    for (const field of selectedTemplate.inputFields) {
      const raw = values[field.key] ?? '';
      if (field.required && raw.trim() === '') {
        nextErrors[field.key] = 'This field is required.';
        continue;
      }
      if (raw.trim() !== '') {
        const numericValue = Number(raw);
        if (!Number.isFinite(numericValue)) {
          nextErrors[field.key] = 'Enter a valid number.';
        } else {
          numericValues[field.key] = numericValue;
        }
      }
    }
    setFieldErrors(nextErrors);
    setError(null);
    setResult(null);
    if (Object.keys(nextErrors).length > 0 || !authUserId) {
      if (!authUserId) setError('Sign in to evaluate and save calculations.');
      return;
    }
    try {
      const evaluated = mhdEvaluateFormula(selectedTemplate.formula, numericValues);
      mhdAppendCalculatorHistoryEntry(authUserId, {
        mode: 'guided', label: selectedTemplate.title, expression: selectedTemplate.formula, result: evaluated,
      });
      setResult({ label: selectedTemplate.resultLabel, value: formatResult(evaluated, selectedTemplate.resultUnit, selectedTemplate.resultDecimals) });
      setHistoryRefresh((current) => current + 1);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'This calculation could not be evaluated.');
    }
  }

  function recall(entry: MhdCalculatorHistoryEntry) {
    setSelectedTemplate(null);
    setResult({ label: entry.label, value: new Intl.NumberFormat(undefined, { maximumFractionDigits: 10 }).format(entry.result) });
    setError(null);
    setFieldErrors({});
  }

  if (templatesQuery.isLoading) return <p className="text-sm text-muted-foreground">Loading calculators…</p>;
  if (templatesQuery.isError) return <p className="text-sm text-destructive">Unable to load calculators.</p>;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(260px,0.85fr)_minmax(300px,1.15fr)]">
      <section className="rounded-lg border border-border bg-card p-4" aria-label="Calculator templates">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Guided calculators</h2>
        <label className="mb-4 block text-sm text-foreground" htmlFor="calculator-template-search">
          Search calculators
          <input id="calculator-template-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title or description" className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <div className="space-y-4">
          {groupedTemplates.map((group) => (
            <div key={group.category}>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.category}</h3>
              <div className="space-y-1">
                {group.templates.map((template) => (
                  <button type="button" key={template.id} onClick={() => selectTemplate(template)} className={`flex w-full items-start gap-3 rounded-md p-3 text-left hover:bg-muted ${selectedTemplate?.id === template.id ? 'bg-muted' : ''}`}>
                    <MhdCalculatorIcon name={template.icon} className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="min-w-0"><span className="block text-sm font-medium text-foreground">{template.title}</span><span className="block truncate text-xs text-muted-foreground">{template.description}</span></span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {groupedTemplates.length === 0 && <p className="text-sm text-muted-foreground">No calculators match your search.</p>}
        </div>
      </section>

      <div className="space-y-4">
        {selectedTemplate ? (
          <section className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">{selectedTemplate.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selectedTemplate.description}</p>
            <form className="mt-5 space-y-4" onSubmit={submit} noValidate>
              {selectedTemplate.inputFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-foreground" htmlFor={`calculator-field-${field.key}`}>
                    {field.label}{field.required && <span className="ml-1 text-destructive" aria-label="required">*</span>}
                  </label>
                  <div className="mt-1 flex items-center">
                    {field.unit && <span className="rounded-l-md border border-r-0 border-border bg-muted px-3 py-2 text-sm text-muted-foreground">{field.unit}</span>}
                    {fieldType(field) === 'select' ? (
                      <select id={`calculator-field-${field.key}`} value={values[field.key] ?? ''} onChange={(event) => updateValue(field.key, event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground" aria-invalid={Boolean(fieldErrors[field.key])}>
                        <option value="">Select an option</option>
                        {(field.options ?? []).map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                      </select>
                    ) : (
                      <input id={`calculator-field-${field.key}`} type="number" value={values[field.key] ?? ''} onChange={(event) => updateValue(field.key, event.target.value)} min={field.min} max={field.max} step={field.step ?? (field.type === 'integer' ? 1 : 'any')} className={`${field.unit ? 'rounded-r-md' : ''} w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground`} aria-invalid={Boolean(fieldErrors[field.key])} />
                    )}
                  </div>
                  {field.helpText && <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>}
                  {fieldErrors[field.key] && <p className="mt-1 text-xs text-destructive" role="alert">{fieldErrors[field.key]}</p>}
                </div>
              ))}
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Calculate</button>
            </form>
            {result && <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4" aria-live="polite"><p className="text-sm text-muted-foreground">{result.label}</p><p className="mt-1 text-3xl font-semibold text-foreground">{result.value}</p></div>}
          </section>
        ) : result ? (
          <section className="rounded-lg border border-border bg-card p-4" aria-live="polite"><p className="text-sm text-muted-foreground">Recalled result · {result.label}</p><p className="mt-1 text-3xl font-semibold text-foreground">{result.value}</p><p className="mt-2 text-xs text-muted-foreground">Select a calculator to run a new guided calculation.</p></section>
        ) : <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">Choose a calculator to get started.</p>}
        {authUserId ? <MhdCalculatorHistory userId={authUserId} onRecall={recall} refreshToken={historyRefresh} /> : <p className="text-sm text-muted-foreground">Sign in to save calculator history.</p>}
      </div>
    </div>
  );
}
