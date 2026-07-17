import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMhdAuth } from '@/features/authentication/Hook';
import type { MhdForm } from '../Types';
import { mhdFormService } from '../Service';
import { MhdFormBuilder } from './MhdFormBuilder';

export function MhdFormBuilderPage() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { profile } = useMhdAuth();
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
    return <div className="p-6 text-sm text-red-600">The current user profile does not include a company context.</div>;
  }

  if (!isNewForm && isLoading) {
    return <div className="p-6 text-sm text-slate-500">Loading form builder...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link to="/forms" className="font-semibold text-blue-700 hover:underline">
                Forms
              </Link>
              <span>/</span>
              <span>{form ? form.referenceId : 'New Form'}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              {form ? `Form Builder: ${form.name}` : 'Create Form'}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Builder edits save through the live `mhd_create_form`, `mhd_update_form`, and `mhd_publish_form` RPCs.
            </p>
          </div>
          <Link to="/forms" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Back to Forms
          </Link>
        </div>

        {errorMessage ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
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
    </main>
  );
}
