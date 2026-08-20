import { Link } from 'react-router-dom';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdProgressBar } from '@/components/ui/MhdProgressBar';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdMyChecklistInstances } from '../Hook';
import { mhdFormatChecklistValue, type MhdChecklistInstanceSummary } from '../Types';

// Detail/completion (checking off items, evidence attachment) lives at
// /checklists/:instanceId -> MhdChecklistInstanceDetailPage, not here.
export function MhdMyChecklistsPage() {
  const instances = useMhdMyChecklistInstances();

  return (
    <div className="space-y-6">
      <MhdPageHeader title="My Checklists" description="Checklist assignments currently assigned to you." />
      {instances.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading checklists...</p>
      ) : (instances.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">You have no assigned checklists.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Checklist</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Due</MhdTh>
                <MhdTh>Progress</MhdTh>
                <MhdTh />
              </tr>
            </thead>
            <tbody>
              {(instances.data ?? []).map((item) => <MhdChecklistRow key={item.id} item={item} />)}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}

function MhdChecklistRow({ item }: { item: MhdChecklistInstanceSummary }) {
  const percent = item.totalItems > 0 ? (item.completedItems / item.totalItems) * 100 : 0;
  return (
    <MhdTr>
      <MhdTd>
        <p className="font-medium">{item.title}</p>
        <p className="font-mono text-xs text-muted-foreground">{item.referenceId}</p>
      </MhdTd>
      <MhdTd><MhdBadge variant={item.status === 'COMPLETED' ? 'success' : 'warning'}>{mhdFormatChecklistValue(item.status)}</MhdBadge></MhdTd>
      <MhdTd>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'None'}</MhdTd>
      <MhdTd><MhdProgressBar percent={percent} showLabel /></MhdTd>
      <MhdTd className="text-right"><Link className="text-sm font-medium text-accent" to={`/checklists/${item.id}`}>Open</Link></MhdTd>
    </MhdTr>
  );
}
