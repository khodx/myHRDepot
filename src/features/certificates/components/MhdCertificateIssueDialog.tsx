import { useMemo, useState } from 'react';
import { Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCertificateEligiblePeople, useMhdIssueCertificate } from '../Hook';
import { mhdCertificateIssueFormSchema } from '../Schemas';
import {
  MHD_CERTIFICATE_CATEGORIES,
  MHD_CERTIFICATE_CATEGORY_LABELS,
  MHD_CERTIFICATE_TEMPLATE_KEYS,
  type MhdCertificateCategory,
  type MhdCertificateTemplate,
} from '../Types';

const inputClass =
  'w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
const labelClass = 'text-sm font-medium text-foreground';

interface Props {
  companyId: string;
  templates: MhdCertificateTemplate[];
  onClose: () => void;
  onIssued: (verificationCode: string) => void;
}

/**
 * Issues an award, promotion, or general certificate. Training completion
 * certificates are issued from the Training feature's own "Generate
 * Certificate" action (mhd_training_certificate_generate) — this dialog is
 * for the categories with no other owning workflow.
 */
export function MhdCertificateIssueDialog({ companyId, templates, onClose, onIssued }: Props) {
  const { profile } = useMhdAuth();
  const people = useMhdCertificateEligiblePeople(companyId);
  const issue = useMhdIssueCertificate();

  const [category, setCategory] = useState<MhdCertificateCategory>('AWARD');
  const [personId, setPersonId] = useState('');
  const [awardTitle, setAwardTitle] = useState('');
  const [awardReason, setAwardReason] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [previousTitle, setPreviousTitle] = useState('');
  const [certificateTitle, setCertificateTitle] = useState('');
  const [certificateBody, setCertificateBody] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const template = useMemo(
    () => templates.find((t) => t.templateKey === MHD_CERTIFICATE_TEMPLATE_KEYS[category]) ?? null,
    [templates, category],
  );

  const selectedPerson = useMemo(
    () => (people.data ?? []).find((p) => p.id === personId) ?? null,
    [people.data, personId],
  );

  async function handleSubmit() {
    setFormError(null);
    const parsed = mhdCertificateIssueFormSchema.safeParse({
      category,
      personId,
      awardTitle,
      awardReason,
      newTitle,
      previousTitle,
      certificateTitle,
      certificateBody,
      expiresAt,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Check the form and try again.');
      return;
    }
    if (!template) {
      setFormError(`The ${MHD_CERTIFICATE_CATEGORY_LABELS[category]} template is not available.`);
      return;
    }
    if (!selectedPerson) {
      setFormError('Select a person.');
      return;
    }

    const personName =
      selectedPerson.preferredName ?? `${selectedPerson.firstName} ${selectedPerson.lastName}`;
    const generatedDate = new Date().toISOString().slice(0, 10);
    const issuedByName = profile?.displayName ?? undefined;

    const mergeData: Record<string, unknown> =
      category === 'AWARD'
        ? {
            person_name: personName,
            company_name: selectedPerson.companyName,
            award_title: awardTitle.trim(),
            award_reason: awardReason.trim() || undefined,
            issued_date: generatedDate,
            issued_by_name: issuedByName,
            generated_date: generatedDate,
          }
        : category === 'PROMOTION'
          ? {
              person_name: personName,
              company_name: selectedPerson.companyName,
              new_title: newTitle.trim(),
              previous_title: previousTitle.trim() || undefined,
              effective_date: generatedDate,
              issued_by_name: issuedByName,
              generated_date: generatedDate,
            }
          : {
              person_name: personName,
              company_name: selectedPerson.companyName,
              certificate_title: certificateTitle.trim(),
              certificate_body: certificateBody.trim() || undefined,
              issued_date: generatedDate,
              issued_by_name: issuedByName,
              generated_date: generatedDate,
            };

    try {
      const result = await issue.mutateAsync({
        companyId,
        templateId: template.id,
        personId: selectedPerson.id,
        entityType: category,
        mergeData,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      onIssued(result.verificationCode);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not issue the certificate.');
    }
  }

  return (
    <MhdModal onClose={onClose} title="Issue Certificate">
      <div className="max-h-[80vh] overflow-y-auto p-6">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">Issue Certificate</h2>
        </div>

        <MhdFormFieldStack>
          <div>
            <label className={labelClass} htmlFor="certificate-category">
              Certificate Type
            </label>
            <select
              id="certificate-category"
              className={inputClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as MhdCertificateCategory)}
            >
              {MHD_CERTIFICATE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {MHD_CERTIFICATE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="certificate-person">
              Recipient
            </label>
            <select
              id="certificate-person"
              className={inputClass}
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
            >
              <option value="">
                {people.isLoading ? 'Loading people…' : 'Select a person'}
              </option>
              {(people.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.preferredName ?? `${p.firstName} ${p.lastName}`}
                </option>
              ))}
            </select>
          </div>

          {category === 'AWARD' ? (
            <>
              <div>
                <label className={labelClass} htmlFor="award-title">
                  Award Title
                </label>
                <input
                  id="award-title"
                  className={inputClass}
                  value={awardTitle}
                  onChange={(e) => setAwardTitle(e.target.value)}
                  placeholder="Employee of the Quarter"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="award-reason">
                  Reason (Optional)
                </label>
                <textarea
                  id="award-reason"
                  className={inputClass}
                  rows={3}
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                />
              </div>
            </>
          ) : null}

          {category === 'PROMOTION' ? (
            <>
              <div>
                <label className={labelClass} htmlFor="new-title">
                  New Title
                </label>
                <input
                  id="new-title"
                  className={inputClass}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Senior HR Partner"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="previous-title">
                  Previous Title (Optional)
                </label>
                <input
                  id="previous-title"
                  className={inputClass}
                  value={previousTitle}
                  onChange={(e) => setPreviousTitle(e.target.value)}
                />
              </div>
            </>
          ) : null}

          {category === 'GENERAL_CERTIFICATE' ? (
            <>
              <div>
                <label className={labelClass} htmlFor="certificate-title">
                  Certificate Title
                </label>
                <input
                  id="certificate-title"
                  className={inputClass}
                  value={certificateTitle}
                  onChange={(e) => setCertificateTitle(e.target.value)}
                  placeholder="Certificate of Appreciation"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="certificate-body">
                  Body Text (Optional)
                </label>
                <textarea
                  id="certificate-body"
                  className={inputClass}
                  rows={3}
                  value={certificateBody}
                  onChange={(e) => setCertificateBody(e.target.value)}
                />
              </div>
            </>
          ) : null}

          <div>
            <label className={labelClass} htmlFor="certificate-expires">
              Expires (Optional)
            </label>
            <input
              id="certificate-expires"
              type="date"
              className={inputClass}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </MhdFormFieldStack>

        {formError ? <p className="mt-3 text-sm text-rose-600">{formError}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={issue.isPending}>
            {issue.isPending ? 'Issuing…' : 'Issue Certificate'}
          </Button>
        </div>
      </div>
    </MhdModal>
  );
}
