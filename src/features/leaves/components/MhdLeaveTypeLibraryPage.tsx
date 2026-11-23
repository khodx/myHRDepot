import { useCallback, useState } from 'react';
import { Library } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdActionsTh, MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdIsPlatformAdminOrHrPartner, mhdLeavesIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdDraft } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS, MHD_DRAFT_NEW_KEY } from '@/features/drafts/Types';
import {
  useMhdCreateLeaveType,
  useMhdForkLeaveType,
  useMhdLeaveTypes,
  useMhdUpdateLeaveType,
} from '../Hook';
import type { MhdLeaveTypeFormValues } from '../Schemas';
import {
  mhdFormatLeaveJurisdiction,
  mhdFormatLeaveMeasurementMethod,
  mhdFormatLeaveHours,
  type MhdLeaveType,
} from '../Types';
import { MhdLeaveTypeForm } from './MhdLeaveTypeForm';
import { MhdFormIntakeDefaultPanel } from '@/components/ui/MhdFormIntakeDefaultPanel';

/**
 * `/leaves/policy-library` — the leave types Studio/library (migration 0185).
 *
 * Lists via the existing, unchanged `mhd_leave_type_list` (already
 * company-scoped and already carries `is_global`) — no new list RPC was
 * needed. Edit access is split by row tier:
 *
 * - GLOBAL rows (`isGlobal`, `company_id is null`): Platform Admin / HR
 *   Partner only, matching `mhd_can_manage_leave_type`'s global-tier check.
 * - COMPANY rows: the wider Leaves-privileged set (Platform Admin / HR
 *   Partner / Client Admin), matching that function's company-tier check.
 *
 * This page is administrative CONFIG ONLY — entitlement hours, measurement
 * method, certification requirement, citation. It never touches
 * `leave_rule_sets` (the real FMLA/CFRA/PDL legal rule content) or
 * `compliance_content_registry`; those stay behind the separate
 * counsel/compliance pre-live review gate documented in CLAUDE.md and get no
 * self-service edit surface anywhere in this feature.
 */
export function MhdLeaveTypeLibraryPage() {
  const { profile, roles } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const canManageGlobal = mhdIsPlatformAdminOrHrPartner(roles);
  const canManageCompany = mhdLeavesIsPrivileged(roles);

  const [isCreating, setIsCreating] = useState(false);
  const [editingType, setEditingType] = useState<MhdLeaveType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forkingId, setForkingId] = useState<string | null>(null);

  const leaveTypes = useMhdLeaveTypes(companyId || null);
  const createType = useMhdCreateLeaveType();
  const updateType = useMhdUpdateLeaveType();
  const forkType = useMhdForkLeaveType();
  // One draft per leave type being edited, plus one for the type being created.
  const draft = useMhdDraft({
    draftKind: MHD_DRAFT_KINDS.leaveTypeForm,
    draftKey: editingType?.id ?? MHD_DRAFT_NEW_KEY,
    companyId: companyId || null,
    enabled: isCreating || editingType !== null,
  });

  // A stable onClose: MhdModal's focus trap re-runs (and refocuses the close button) whenever onClose changes identity.
  const closeCreate = useCallback(() => setIsCreating(false), []);
  const closeEdit = useCallback(() => setEditingType(null), []);

  function canEditRow(type: MhdLeaveType): boolean {
    return type.isGlobal ? canManageGlobal : canManageCompany;
  }

  async function handleCreate(values: MhdLeaveTypeFormValues) {
    setErrorMessage(null);
    try {
      await createType.mutateAsync({
        // isGlobal only ever reaches `true` when the form rendered the
        // publish-to-library checkbox, which it only does for
        // canManageGlobal — the RPC re-checks this server-side regardless.
        companyId: values.isGlobal ? null : values.companyId,
        typeKey: values.typeKey,
        typeName: values.typeName,
        jurisdiction: values.jurisdiction,
        entitlementHours: values.entitlementHours,
        measurementMethod: values.measurementMethod,
        measurementMonths: values.measurementMonths,
        requiresCertification: values.requiresCertification,
        citation: values.citation,
      });
      await draft.discard();
      setIsCreating(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create leave type.');
    }
  }

  async function handleEdit(values: MhdLeaveTypeFormValues) {
    if (!editingType) return;
    setErrorMessage(null);
    try {
      await updateType.mutateAsync({
        typeId: editingType.id,
        typeName: values.typeName,
        entitlementHours: values.entitlementHours,
        measurementMethod: values.measurementMethod,
        measurementMonths: values.measurementMonths,
        requiresCertification: values.requiresCertification,
        citation: values.citation,
      });
      await draft.discard();
      setEditingType(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update leave type.');
    }
  }

  async function handleFork(sourceType: MhdLeaveType) {
    if (!companyId) return;
    setErrorMessage(null);
    setForkingId(sourceType.id);
    try {
      await forkType.mutateAsync({ sourceTypeId: sourceType.id, companyId });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to fork leave type.');
    } finally {
      setForkingId(null);
    }
  }

  const types = leaveTypes.data ?? [];

  return (
    <div className="space-y-6">
      <MhdPageHeader
        backTo="/leaves"
        backLabel="Leaves of absence"
        title="Leave Types Policy Library"
        description="Administrative config for each leave basis — entitlement hours, measurement window, and certification requirement. Legal rule content lives elsewhere and is not edited here."
        actions={
          canManageCompany && companyId ? (
            <Button onClick={() => setIsCreating(true)} className="h-9 px-3 text-[16.8px]">
              New Type
            </Button>
          ) : undefined
        }
      />
      {mhdIsPlatformAdminOrHrPartner(roles) && companyId ? (
        <MhdFormIntakeDefaultPanel companyId={companyId} intakeKind="leaveCase" label="Leave" />
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {leaveTypes.isLoading ? (
        <MhdCard className="p-6 text-sm text-muted-foreground">Loading…</MhdCard>
      ) : types.length === 0 ? (
        <MhdCard className="border border-dashed border-border">
          <MhdEmptyState icon={Library} title="No leave types on record." />
        </MhdCard>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Type</MhdTh>
                <MhdTh>Jurisdiction</MhdTh>
                <MhdTh>Entitlement</MhdTh>
                <MhdTh>Measurement</MhdTh>
                <MhdTh>Certification</MhdTh>
                <MhdActionsTh />
              </tr>
            </thead>
            <tbody>
              {types.map((type) => (
                <MhdTr key={type.id}>
                  <MhdTd>
                    <div className="font-medium text-foreground">
                      {type.typeName}
                      {type.isGlobal ? (
                        <span
                          className="ml-2"
                          title="Seeded and maintained centrally. Editing it would change what every company resolves against."
                        >
                          <MhdBadge variant="info">Global</MhdBadge>
                        </span>
                      ) : null}
                      {type.requiresCertification ? (
                        <MhdBadge variant="neutral" className="ml-2">
                          Certification required
                        </MhdBadge>
                      ) : null}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{type.typeKey}</div>
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {mhdFormatLeaveJurisdiction(type.jurisdiction)}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {mhdFormatLeaveHours(type.entitlementHours)}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {mhdFormatLeaveMeasurementMethod(type.measurementMethod)}
                    {type.measurementMonths ? ` (${type.measurementMonths} mo)` : ''}
                  </MhdTd>
                  <MhdTd className="text-muted-foreground">
                    {type.requiresCertification ? 'Required' : '—'}
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-right">
                    <div className="flex justify-end gap-3">
                      {canEditRow(type) ? (
                        <button
                          type="button"
                          onClick={() => setEditingType(type)}
                          className="text-sm font-medium text-accent hover:text-accent-hover"
                        >
                          Edit
                        </button>
                      ) : null}
                      {type.isGlobal && canManageCompany && companyId ? (
                        <button
                          type="button"
                          disabled={forkType.isPending && forkingId === type.id}
                          onClick={() => void handleFork(type)}
                          className="text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-50"
                        >
                          {forkType.isPending && forkingId === type.id
                            ? 'Forking…'
                            : 'Fork to My Company'}
                        </button>
                      ) : null}
                      {!canEditRow(type) && !(type.isGlobal && canManageCompany) ? (
                        <span className="text-xs text-muted-foreground">Read-only</span>
                      ) : null}
                    </div>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}

      {isCreating && canManageCompany && companyId ? (
        <MhdFormModal title="New Leave Type" size="lg" onClose={closeCreate}>
          <MhdLeaveTypeForm
            companyId={companyId}
            canPublishGlobal={canManageGlobal}
            onSubmit={handleCreate}
            onCancel={closeCreate}
            isSubmitting={createType.isPending}
            draft={draft}
          />
        </MhdFormModal>
      ) : null}

      {editingType ? (
        <MhdFormModal title="Edit Leave Type" size="lg" onClose={closeEdit}>
          <MhdLeaveTypeForm
            key={editingType.id}
            companyId={companyId}
            canPublishGlobal={canManageGlobal}
            leaveType={editingType}
            onSubmit={handleEdit}
            onCancel={closeEdit}
            isSubmitting={updateType.isPending}
            draft={draft}
          />
        </MhdFormModal>
      ) : null}
    </div>
  );
}
