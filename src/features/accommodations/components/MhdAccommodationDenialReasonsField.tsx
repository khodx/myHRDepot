import { mhdAccommodationDenialReasonsSchema } from '../Schemas';
import {
  MHD_ACCOMMODATION_DENIAL_REASON_RULES,
  MHD_ACCOMMODATION_DENIAL_REASONS,
  mhdFormatAccommodationValue,
  type MhdAccommodationDenialReason,
  type MhdAccommodationDenialReasonCode,
  type MhdAccommodationDenialReasonInput,
} from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

const DEFAULT_DETAIL_PROMPT = 'Specifics';
const DEFAULT_ALTERNATIVE_PROMPT = 'The Accommodation Offered';

interface MhdAccommodationDenialReasonsFieldProps {
  value: MhdAccommodationDenialReasonInput[];
  onChange: (next: MhdAccommodationDenialReasonInput[]) => void;
  /** Rows of accommodation_denial_reason_codes (useMhdAccommodationDenialReasonCodes). */
  vocabulary: MhdAccommodationDenialReasonCode[];
}

/**
 * The value list the field renders. The table is the vocabulary; while it is still loading the
 * validation constant stands in with formatted labels so the form never flashes empty.
 */
function resolveVocabulary(
  vocabulary: MhdAccommodationDenialReasonCode[],
): MhdAccommodationDenialReasonCode[] {
  if (vocabulary.length) {
    return [...vocabulary].sort((left, right) => left.sortOrder - right.sortOrder);
  }
  return MHD_ACCOMMODATION_DENIAL_REASONS.map((code, index) => ({
    code,
    label: mhdFormatAccommodationValue(code),
    sortOrder: index,
    requiresDetail: MHD_ACCOMMODATION_DENIAL_REASON_RULES[code].requiresDetail,
    detailPrompt: null,
    requiresAlternative: MHD_ACCOMMODATION_DENIAL_REASON_RULES[code].requiresAlternative,
    alternativePrompt: null,
  }));
}

/** Field-level messages from the shared schema, keyed by reason code. */
function reasonErrors(value: MhdAccommodationDenialReasonInput[]) {
  const parsed = mhdAccommodationDenialReasonsSchema.safeParse(value);
  const byCode = new Map<
    MhdAccommodationDenialReason,
    { detail?: string; alternativeOffered?: string }
  >();
  const general: string[] = [];
  if (parsed.success) return { byCode, general };
  for (const issue of parsed.error.issues) {
    const [index, field] = issue.path;
    const reason = typeof index === 'number' ? value[index] : undefined;
    if (reason && (field === 'detail' || field === 'alternativeOffered')) {
      const current = byCode.get(reason.code) ?? {};
      current[field] = current[field] ?? issue.message;
      byCode.set(reason.code, current);
    } else if (!general.includes(issue.message)) {
      general.push(issue.message);
    }
  }
  return { byCode, general };
}

/**
 * The combinable reasons for a denied or partly approved decision (Section D). Each checked reason
 * reveals the specifics its row asks for; the shared schema supplies the inline errors, and the
 * parent blocks the decision until the set is valid.
 */
export function MhdAccommodationDenialReasonsField({
  value,
  onChange,
  vocabulary,
}: MhdAccommodationDenialReasonsFieldProps) {
  const rows = resolveVocabulary(vocabulary);
  const { byCode, general } = reasonErrors(value);

  function toggle(code: MhdAccommodationDenialReason, checked: boolean) {
    if (checked) {
      onChange([...value, { code, detail: '', alternativeOffered: '' }]);
    } else {
      onChange(value.filter((reason) => reason.code !== code));
    }
  }

  function update(
    code: MhdAccommodationDenialReason,
    field: 'detail' | 'alternativeOffered',
    text: string,
  ) {
    onChange(value.map((reason) => (reason.code === code ? { ...reason, [field]: text } : reason)));
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Reasons For The Denial</legend>
      {general.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-rose-700">
          {general.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : null}
      {rows.map((row) => {
        const selected = value.find((reason) => reason.code === row.code);
        const errors = byCode.get(row.code);
        const detailId = `mhd-denial-${row.code}-detail`;
        const alternativeId = `mhd-denial-${row.code}-alternative`;
        return (
          <div key={row.code} className="space-y-2 rounded-md border border-border p-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-border"
                checked={Boolean(selected)}
                onChange={(event) => toggle(row.code, event.target.checked)}
              />
              <span>{row.label}</span>
            </label>
            {selected && row.requiresDetail ? (
              <div className="pl-6">
                <label className="block text-sm font-medium" htmlFor={detailId}>
                  {row.detailPrompt ?? DEFAULT_DETAIL_PROMPT}
                </label>
                <textarea
                  id={detailId}
                  className={`mt-1 min-h-16 ${inputClass}`}
                  value={selected.detail ?? ''}
                  aria-invalid={Boolean(errors?.detail)}
                  onChange={(event) => update(row.code, 'detail', event.target.value)}
                />
                {errors?.detail ? (
                  <p className="mt-1 text-xs text-rose-700">{errors.detail}</p>
                ) : null}
              </div>
            ) : null}
            {selected && row.requiresAlternative ? (
              <div className="pl-6">
                <label className="block text-sm font-medium" htmlFor={alternativeId}>
                  {row.alternativePrompt ?? DEFAULT_ALTERNATIVE_PROMPT}
                </label>
                <textarea
                  id={alternativeId}
                  className={`mt-1 min-h-16 ${inputClass}`}
                  value={selected.alternativeOffered ?? ''}
                  aria-invalid={Boolean(errors?.alternativeOffered)}
                  onChange={(event) => update(row.code, 'alternativeOffered', event.target.value)}
                />
                {errors?.alternativeOffered ? (
                  <p className="mt-1 text-xs text-rose-700">{errors.alternativeOffered}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </fieldset>
  );
}

export default MhdAccommodationDenialReasonsField;
