import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { mhdCanManageDocumentContent, mhdIsPlatformAdmin } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdDocumentBranding, useMhdSaveDocumentBranding } from '../Hook';
import { mhdDocumentBrandingFormSchema } from '../Schemas';
import {
  MHD_DOCUMENT_BRANDING_FONTS,
  type MhdDocumentBranding,
  type MhdDocumentBrandingFont,
  type MhdSaveDocumentBrandingInput,
} from '../Types';

const MAX_LOGO_BYTES = 300 * 1024;
const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

interface LetterheadFormValues {
  headerText: string;
  footerText: string;
  accentColor: string;
  fontFamily: MhdDocumentBrandingFont;
  logoDataUri: string | null;
  showReferenceId: boolean;
}

function formValuesFromBranding(branding: MhdDocumentBranding): LetterheadFormValues {
  return {
    headerText: branding.headerText ?? '',
    footerText: branding.footerText ?? '',
    accentColor: branding.accentColor,
    fontFamily: branding.fontFamily,
    logoDataUri: branding.logoDataUri,
    showReferenceId: branding.showReferenceId,
  };
}

interface LetterheadFormProps {
  branding: MhdDocumentBranding;
  selectedCompanyId: string | null;
  canEdit: boolean;
}

/**
 * The form proper. It is mounted with a `key` that changes whenever a different letterhead is
 * loaded (another scope, or a company's first own row replacing the platform default), so its
 * state starts from the loaded data instead of being synced from it in an effect.
 */
function LetterheadForm({ branding, selectedCompanyId, canEdit }: LetterheadFormProps) {
  const saveBranding = useMhdSaveDocumentBranding();
  const [values, setValues] = useState<LetterheadFormValues>(() =>
    formValuesFromBranding(branding),
  );
  const [initialValues, setInitialValues] = useState<LetterheadFormValues>(() =>
    formValuesFromBranding(branding),
  );
  const [logoError, setLogoError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const isDirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [initialValues, values],
  );

  function updateValues(patch: Partial<LetterheadFormValues>) {
    setValues((current) => ({ ...current, ...patch }));
    setSavedMessage(null);
  }

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setLogoError(null);
    if (!file) return;
    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setLogoError('Logo must be a PNG, JPEG or GIF image.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('Logo must be 300 KB or smaller.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') updateValues({ logoDataUri: reader.result });
    };
    reader.onerror = () => setLogoError('Unable to read that logo file.');
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit) return;
    setFormError(null);
    setSavedMessage(null);
    const parsed = mhdDocumentBrandingFormSchema.safeParse({
      ...values,
      headerText: values.headerText || null,
      footerText: values.footerText || null,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Please correct the letterhead form.');
      return;
    }
    const input: MhdSaveDocumentBrandingInput = {
      companyId: selectedCompanyId,
      headerText: parsed.data.headerText ?? null,
      footerText: parsed.data.footerText ?? null,
      accentColor: parsed.data.accentColor,
      fontFamily: parsed.data.fontFamily,
      logoDataUri: parsed.data.logoDataUri,
      showReferenceId: parsed.data.showReferenceId,
    };
    try {
      await saveBranding.mutateAsync(input);
      setInitialValues(values);
      setSavedMessage('Letterhead saved.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save letterhead.');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
      <MhdCard>
        {!canEdit ? (
          <p className="mb-4 text-sm text-muted-foreground">
            You have view-only access to document letterhead settings.
          </p>
        ) : null}
        <form onSubmit={(event) => void handleSubmit(event)}>
          <MhdFormFieldStack>
            <label className="text-sm font-medium text-foreground">
              Header Line
              <input
                maxLength={200}
                disabled={!canEdit}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={values.headerText}
                onChange={(event) => updateValues({ headerText: event.target.value })}
              />
            </label>
            <label className="text-sm font-medium text-foreground">
              Footer Line
              <input
                maxLength={400}
                disabled={!canEdit}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={values.footerText}
                onChange={(event) => updateValues({ footerText: event.target.value })}
              />
            </label>
            <div className="text-sm font-medium text-foreground">
              <span>Accent Colour</span>
              <div className="mt-1 flex gap-2">
                <input
                  aria-label="Accent colour picker"
                  type="color"
                  disabled={!canEdit}
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(values.accentColor) ? values.accentColor : '#000000'
                  }
                  onChange={(event) =>
                    updateValues({ accentColor: event.target.value.toUpperCase() })
                  }
                />
                <input
                  aria-label="Accent colour hex"
                  disabled={!canEdit}
                  className="flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                  value={values.accentColor}
                  onChange={(event) => updateValues({ accentColor: event.target.value })}
                />
              </div>
            </div>
            <label className="text-sm font-medium text-foreground">
              Font
              <select
                disabled={!canEdit}
                className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
                value={values.fontFamily}
                onChange={(event) =>
                  updateValues({ fontFamily: event.target.value as MhdDocumentBrandingFont })
                }
              >
                {MHD_DOCUMENT_BRANDING_FONTS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-sm font-medium text-foreground">
              <label>Logo</label>
              <input
                aria-label="Logo"
                type="file"
                accept="image/png,image/jpeg,image/gif"
                disabled={!canEdit}
                className="mt-1 block w-full text-sm text-foreground"
                onChange={handleLogoChange}
              />
              {logoError ? (
                <p role="alert" className="mt-2 text-sm text-red-700">
                  {logoError}
                </p>
              ) : null}
              {values.logoDataUri ? (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={values.logoDataUri}
                    alt="Logo preview"
                    className="max-h-16 max-w-48 object-contain"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!canEdit}
                    onClick={() => updateValues({ logoDataUri: null })}
                  >
                    Remove Logo
                  </Button>
                </div>
              ) : null}
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={values.showReferenceId}
                onChange={(event) => updateValues({ showReferenceId: event.target.checked })}
              />
              Show Reference Id On Documents
            </label>
          </MhdFormFieldStack>
          {formError ? (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {formError}
            </div>
          ) : null}
          {savedMessage ? (
            <div role="status" className="mt-4 text-sm text-green-700">
              {savedMessage}
            </div>
          ) : null}
          <Button
            type="submit"
            className="mt-4"
            disabled={!canEdit || !isDirty || saveBranding.isPending}
          >
            {saveBranding.isPending ? 'Saving...' : 'Save Letterhead'}
          </Button>
        </form>
      </MhdCard>

      <MhdCard>
        <h2 className="text-[15px] font-semibold text-foreground">Preview</h2>
        <div
          className="mt-4 rounded-md border bg-white p-5 text-sm text-slate-800"
          style={{
            borderTopColor: values.accentColor,
            borderTopWidth: 4,
            fontFamily: values.fontFamily,
          }}
        >
          {values.logoDataUri ? (
            <img
              src={values.logoDataUri}
              alt="Preview logo"
              className="mb-3 max-h-14 max-w-44 object-contain"
            />
          ) : null}
          <p className="border-b pb-2 font-semibold" style={{ borderColor: values.accentColor }}>
            {values.headerText || 'Header line'}
          </p>
          <p className="py-6">
            This is a sample document paragraph showing how your letterhead will look.
          </p>
          {values.showReferenceId ? (
            <p className="text-xs text-slate-500">Reference ABC-1-2345-6-78</p>
          ) : null}
          <p className="mt-3 border-t pt-2 text-xs" style={{ borderColor: values.accentColor }}>
            {values.footerText || 'Footer line'}
          </p>
        </div>
      </MhdCard>
    </div>
  );
}

export function MhdDocumentLetterheadPage() {
  const { profile, roles } = useMhdAuth();
  const isPlatformAdmin = mhdIsPlatformAdmin(roles);
  const canEdit = mhdCanManageDocumentContent(roles);
  const [scope, setScope] = useState<'company' | 'platform'>('company');
  const selectedCompanyId = scope === 'platform' ? null : (profile?.companyId ?? null);
  const brandingQuery = useMhdDocumentBranding(selectedCompanyId);

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Document Letterhead"
        description="How every generated document looks: logo, header, footer, colour and font."
        backTo="/reports"
        backLabel="Reports"
      />

      {brandingQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading letterhead...</p>
      ) : null}
      {brandingQuery.isError ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {brandingQuery.error instanceof Error
            ? brandingQuery.error.message
            : 'Unable to load letterhead.'}
        </div>
      ) : null}

      {isPlatformAdmin ? (
        <label className="block max-w-sm text-sm font-medium text-foreground">
          Scope
          <select
            aria-label="Scope"
            className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            value={scope}
            onChange={(event) => setScope(event.target.value as 'company' | 'platform')}
          >
            <option value="company">My Company</option>
            <option value="platform">Platform Default</option>
          </select>
        </label>
      ) : null}

      {brandingQuery.data?.isPlatformDefault && scope === 'company' ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Your company is using the platform default. Saving creates your own.
        </div>
      ) : null}

      {brandingQuery.data ? (
        <LetterheadForm
          key={`${scope}:${brandingQuery.data.id}`}
          branding={brandingQuery.data}
          selectedCompanyId={selectedCompanyId}
          canEdit={canEdit}
        />
      ) : null}
    </div>
  );
}

export default MhdDocumentLetterheadPage;
