import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateForms } from '@/appshell/mhdRouteAccess';
import type { MhdForm } from '../Types';
import { mhdFormService } from '../Service';
import { MhdFormBuilder } from './MhdFormBuilder';
import { MhdFormPreview } from './MhdFormPreview';
import { MhdFormRecordTabs } from './MhdFormRecordTabs';

export function MhdFormBuilderPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { profile, roles } = useMhdAuth();
  const canMutate = mhdCanMutateForms(roles);
  const isNewForm = !formId || formId === 'new';
  const [form, setForm] = useState<MhdForm | null>(null);
  const [isLoading, setIsLoading] = useState(!isNewForm);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNewForm) return;

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
  }, [formId, isNewForm]);

  if (!profile?.companyId) {
    return (
      <div className="p-6 text-sm text-red-600">
        The current user profile does not include a company context.
      </div>
    );
  }

  if (!isNewForm && isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading form builder...</div>;
  }

  // Read-only roles (Viewer) never see the editable builder: /forms/:formId/edit
  // renders the form preview instead, and /forms/new offers nothing to edit.
  if (!canMutate) {
    return (
      <div className="space-y-6">
        <MhdPageHeader
          backTo={form ? `/forms/${form.id}` : '/forms'}
          backLabel={form ? 'Form Detail' : 'Forms'}
          title={`${form ? form.name : 'Form'} (read-only)`}
          description="You have read-only access to forms."
        />

        {form ? (
          <MhdFormRecordTabs formId={form.id} active="builder" canMutate={canMutate} />
        ) : null}

        <div className="space-y-6">
          {errorMessage ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {form ? (
            <MhdFormPreview
              form={{
                id: form.id,
                name: form.name,
                description: form.description,
                definition: form.definition,
              }}
            />
          ) : (
            <MhdCard className="p-6 text-sm text-muted-foreground">
              There is no form to preview.
            </MhdCard>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo={form ? `/forms/${form.id}` : '/forms'}
        backLabel={form ? 'Form Detail' : 'Forms'}
        title={form ? `Form Builder: ${form.name}` : 'Create Form'}
        description="Builder edits save through the live `mhd_create_form`, `mhd_update_form`, and `mhd_publish_form` RPCs."
      />

      {form ? <MhdFormRecordTabs formId={form.id} active="builder" canMutate={canMutate} /> : null}

      <div className="space-y-6">
        {errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <MhdFormBuilder
          key={form?.id ?? 'new-form'}
          companyId={profile.companyId}
          formId={form?.id}
          initialForm={isNewForm ? null : form}
          onSaved={(savedForm) => {
            setForm(savedForm);
            if (formId === 'new') {
              navigate(`/forms/${savedForm.id}`, { replace: true });
            }
          }}
        />
      </div>
    </div>
  );
}
