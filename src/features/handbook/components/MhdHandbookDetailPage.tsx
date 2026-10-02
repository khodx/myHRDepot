import { useNavigate, useParams } from 'react-router-dom';
import { mhdHandbookIsPrivileged } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import type { MhdHandbookRecordTab } from '@/appshell/components/MhdHandbookRecordTabs';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdHandbooks } from '../Hook';
import { MhdHandbookWizard } from './MhdHandbookWizard';

interface MhdHandbookDetailPageProps {
  /** Which record tab this route renders. Defaults to 'detail'. */
  tab?: MhdHandbookRecordTab;
}

/**
 * `/handbooks/:handbookId` route entry — the handbook wizard (draft editor while a
 * handbook is DRAFT; the frozen version + acknowledgment board once PUBLISHED).
 *
 * Route-entry page: reads `useMhdAuth()` and `useParams()` itself, per the app
 * convention. It inherits the `/handbooks` access rule via the guard's prefix
 * match (the privileged handbook set; Employee and Viewer refused). The handbook is resolved from the company's list — there is no
 * single-handbook getter RPC — so a bad or foreign id resolves to "not found".
 *
 * Document generation is not part of publishing: a published version is exported on
 * demand from the Export section (PDF, or Word for administrators), rendered from the
 * frozen version. The signature ceremony lives on the Acknowledgments tab: when the
 * handbook requires a signature, an administrator sends each person a signature request
 * for a short per-person receipt, and the person can only acknowledge once it is signed.
 */
export function MhdHandbookDetailPage({ tab = 'detail' }: MhdHandbookDetailPageProps) {
  const { profile, roles } = useMhdAuth();
  const navigate = useNavigate();
  const { handbookId = '' } = useParams<{ handbookId: string }>();
  const companyId = profile?.companyId ?? '';
  const canManage = mhdHandbookIsPrivileged(roles);

  const handbooks = useMhdHandbooks({ companyId: companyId || null });
  const handbook = (handbooks.data ?? []).find((item) => item.id === handbookId);

  if (!companyId) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">No company is associated with your account.</p>
      </div>
    );
  }

  if (handbooks.isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Loading handbook…</p>
      </div>
    );
  }

  if (!handbook) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Handbook not found.</p>
        <Button variant="secondary" onClick={() => navigate('/handbooks')}>
          Back to handbooks
        </Button>
      </div>
    );
  }

  return (
    <MhdHandbookWizard
      handbook={handbook}
      companyId={companyId}
      canManage={canManage}
      activeTab={tab}
    />
  );
}
