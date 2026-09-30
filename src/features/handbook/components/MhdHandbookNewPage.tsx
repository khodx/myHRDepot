import { useNavigate, useSearchParams } from 'react-router-dom';
import { mhdHandbookIsPrivileged } from '@/appshell/mhdRouteAccess';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCreateHandbook } from '../Hook';
import type { MhdCreateHandbookFormValues } from '../Schemas';
import { MhdHandbookCreateForm } from './MhdHandbookCreateForm';

/**
 * `/handbooks/new` — step one of the handbook wizard (content pack + title +
 * jurisdictions) as its own routed page. On success it opens the draft at
 * `/handbooks/:handbookId`, where the wizard continues (assemble → publish).
 *
 * The Workplace Safety cross-link (`?handbookType=SAFETY&establishmentId=...`)
 * lands here via the `/handbooks` route and pre-fills the same form. It inherits
 * the `/handbooks` access rule by prefix match; the create RPC re-checks
 * `mhd_handbook_is_privileged` server-side regardless of the `canManage` gate.
 */
export function MhdHandbookNewPage() {
  const { profile, roles } = useMhdAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const companyId = profile?.companyId ?? '';
  const canManage = mhdHandbookIsPrivileged(roles);
  const createHandbook = useMhdCreateHandbook();

  const requestedHandbookType = searchParams.get('handbookType');
  const defaultHandbookType: MhdCreateHandbookFormValues['handbookType'] | undefined =
    requestedHandbookType === 'SAFETY' || requestedHandbookType === 'EMPLOYEE'
      ? requestedHandbookType
      : undefined;
  const establishmentId = searchParams.get('establishmentId');

  async function handleCreate(values: MhdCreateHandbookFormValues) {
    const result = await createHandbook.mutateAsync({
      companyId: values.companyId,
      handbookType: values.handbookType,
      title: values.title,
      jurisdictions: values.jurisdictions,
    });
    navigate(`/handbooks/${result.id}`);
  }

  if (!companyId) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">No company is associated with your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="New Handbook"
        description="Choose the content pack and jurisdictions. Assembly pulls in each jurisdiction's required sections; you review and publish on the next screen."
        backTo="/handbooks"
        backLabel="Handbooks"
      />
      {canManage ? (
        <MhdCard>
          <MhdHandbookCreateForm
            companyId={companyId}
            onSubmit={handleCreate}
            onCancel={() => navigate('/handbooks')}
            isSubmitting={createHandbook.isPending}
            defaultHandbookType={defaultHandbookType}
            establishmentId={establishmentId}
          />
        </MhdCard>
      ) : (
        <p className="text-sm text-muted-foreground">
          Your role cannot create handbooks.
        </p>
      )}
    </div>
  );
}

export default MhdHandbookNewPage;
