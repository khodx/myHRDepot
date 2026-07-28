import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdDetailActions } from '@/components/ui/MhdDetailActions';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateForms } from '@/appshell/mhdRouteAccess';
import type { MhdForm } from '../Types';
import { mhdFormService } from '../Service';
import { MhdFormPreview } from './MhdFormPreview';
import { MhdFormRecordTabs } from './MhdFormRecordTabs';

function statusBadgeVariant(status: MhdForm['status']): MhdBadgeVariant {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'ARCHIVED':
      return 'neutral';
    case 'DRAFT':
    default:
      return 'warning';
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function MhdFormDetailPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { roles } = useMhdAuth();
  const canMutate = mhdCanMutateForms(roles);
  const [form, setForm] = useState<MhdForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;

    let isCancelled = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const loadedForm = await mhdFormService.getFormById(formId);
        if (!isCancelled) {
          setForm(loadedForm);
          setIsLoading(false);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load form');
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
  }, [formId]);

  async function handleArchive() {
    if (!formId) return;
    setActionError(null);
    try {
      await mhdFormService.archiveForm(formId);
      navigate('/forms');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to archive form.');
    }
  }

  if (!formId) {
    return <div className="p-6 text-sm text-red-600">No form id was provided.</div>;
  }

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading form details...</div>;
  }

  if (errorMessage || !form) {
    return (
      <div className="space-y-4">
        <MhdPageHeader title="Form not found" backTo="/forms" backLabel="Forms" />
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage ?? 'The requested form could not be loaded.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <MhdPageHeader
        backTo="/forms"
        backLabel="Forms"
        title={form.name}
        description={form.description || 'Form definition detail record.'}
        chips={<MhdBadge variant={statusBadgeVariant(form.status)}>{form.status}</MhdBadge>}
        actions={
          <>
            <Link
              to={`/forms/${form.id}/render`}
              state={{ backgroundLocation: location }}
              className="rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-accent hover:text-accent"
            >
              Open Form
            </Link>
            {canMutate ? (
              <MhdDetailActions
                editTo={`/forms/${form.id}/edit`}
                onDelete={handleArchive}
                deleteLabel="Archive Form"
                deleteConfirmMessage="Archive this form? It will no longer accept new submissions, but existing submissions are preserved."
              />
            ) : null}
          </>
        }
      />

      <MhdFormRecordTabs formId={form.id} active="detail" canMutate={canMutate} />

      <MhdCard>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailRow label="Reference" value={form.referenceId} />
          <DetailRow label="Version" value={String(form.version)} />
          <DetailRow label="Updated" value={new Date(form.updatedAt).toLocaleString()} />
          <DetailRow
            label="Published"
            value={form.publishedAt ? new Date(form.publishedAt).toLocaleString() : 'Not published'}
          />
        </dl>
      </MhdCard>

      <MhdFormPreview
        form={{
          id: form.id,
          name: form.name,
          description: form.description,
          definition: form.definition,
        }}
      />

      {canMutate ? (
        <div className="flex justify-end border-t border-border pt-4">
          <MhdDetailActions
            editTo={`/forms/${form.id}/edit`}
            onDelete={handleArchive}
            deleteLabel="Archive Form"
            deleteConfirmMessage="Archive this form? It will no longer accept new submissions, but existing submissions are preserved."
          />
        </div>
      ) : null}
    </div>
  );
}
