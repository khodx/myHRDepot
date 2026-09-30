import { Link } from 'react-router-dom';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdHandbooks } from '../Hook';
import { MhdHandbookStatusBadge } from './MhdHandbookStatusBadge';
import { MhdHandbookTypeBadge } from './MhdHandbookTypeBadge';

interface Props {
  companyId: string;
  /**
   * Whether this viewer belongs to the privileged set (Platform Admin / HR
   * Partner / Client Admin) that may create and manage handbooks. This page lives
   * at the admin `/handbooks` route and is gated to that set — the RPCs re-check
   * `mhd_handbook_is_privileged` regardless; this only governs the affordances.
   * The employee acknowledgment surface is the separate `/my-handbooks` page.
   */
  canManage: boolean;
  /** Route to the wizard for a handbook (the create flow lands here on success). */
  onOpenHandbook: (handbookId: string) => void;
}

/**
 * `/handbooks` — the admin list of a company's handbooks, by type and status.
 * "New Handbook" opens the wizard at /handbooks/new (create → assemble → publish). A company
 * keeps one live handbook per type at a time; archived ones remain for history.
 */
export function MhdHandbookListPage({
  companyId,
  canManage,
  onOpenHandbook,
}: Props) {
  const handbooks = useMhdHandbooks({ companyId });

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Handbooks"
        description="Employee and Safety handbooks for this company. Publishing freezes an immutable, hashed version an employee acknowledges."
        actions={
          canManage ? (
            <Link
              to="/handbooks/new"
              className={`${buttonBaseClasses} ${buttonVariantClasses.primary}`}
            >
              New Handbook
            </Link>
          ) : undefined
        }
      />

      {handbooks.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (handbooks.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">No handbooks yet.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Reference</MhdTh>
                <MhdTh>Title</MhdTh>
                <MhdTh>Type</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Effective</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {(handbooks.data ?? []).map((handbook) => (
                <MhdTr key={handbook.id} to={`/handbooks/${handbook.id}`}>
                  <MhdTd className="whitespace-nowrap font-mono text-xs">
                    {handbook.referenceId}
                  </MhdTd>
                  <MhdTd className="font-medium">{handbook.title}</MhdTd>
                  <MhdTd>
                    <MhdHandbookTypeBadge handbookType={handbook.handbookType} />
                  </MhdTd>
                  <MhdTd>
                    <MhdHandbookStatusBadge status={handbook.status} />
                  </MhdTd>
                  <MhdTd className="whitespace-nowrap text-muted-foreground">
                    {handbook.effectiveDate ?? '—'}
                  </MhdTd>
                  <MhdTd className="text-right">
                    <button
                      type="button"
                      onClick={() => onOpenHandbook(handbook.id)}
                      className="text-sm font-medium text-accent hover:text-accent-hover"
                    >
                      Open
                    </button>
                  </MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}
