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
 * match (Platform Admin / HR Partner / Client Admin; Client User and Viewer
 * refused). The handbook is resolved from the company's list — there is no
 * single-handbook getter RPC — so a bad or foreign id resolves to "not found".
 *
 * The doc-gen (`onGenerateDocument`) and e-sign (`onRequestSignature`) ceremony
 * callbacks are deliberately NOT injected here: that orchestration is the host
 * Attachments / signing surface exercised in the browser walkthrough (Stage 5).
 * Without them, publish freezes with no document link and an acknowledgment is
 * assigned with no signature request (the shell path) — the components handle the
 * absence gracefully.
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
