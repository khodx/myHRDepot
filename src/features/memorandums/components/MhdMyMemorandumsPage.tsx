import { useEffect } from 'react';
import { Mail } from 'lucide-react';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { Button } from '@/components/ui/Button';
import { useMhdAcknowledgeMemorandum, useMhdMarkMemorandumRead, useMhdMyMemorandums } from '../Hook';
import { mhdFormatMemorandumValue } from '../Types';

export function MhdMyMemorandumsPage() {
  const memorandums = useMhdMyMemorandums();
  const markRead = useMhdMarkMemorandumRead();
  const acknowledge = useMhdAcknowledgeMemorandum();

  return (
    <div className="space-y-6">
      <MhdPageHeader title="My Memorandums" description="Memorandums sent to you." />

      {memorandums.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !memorandums.data || memorandums.data.length === 0 ? (
        <MhdEmptyState icon={Mail} title="Nothing here yet" description="You have no memorandums." />
      ) : (
        <ul className="space-y-3">
          {memorandums.data.map((item) => (
            <MhdMemorandumRow
              key={item.id}
              item={item}
              onMarkRead={() => markRead.mutate(item.id)}
              onAcknowledge={() => item.acknowledgmentId && acknowledge.mutate(item.acknowledgmentId)}
              acknowledging={acknowledge.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface RowProps {
  item: ReturnType<typeof useMhdMyMemorandums>['data'] extends (infer T)[] | undefined ? T : never;
  onMarkRead: () => void;
  onAcknowledge: () => void;
  acknowledging: boolean;
}

function MhdMemorandumRow({ item, onMarkRead, onAcknowledge, acknowledging }: RowProps) {
  useEffect(() => {
    if (!item.readAt) {
      onMarkRead();
    }
    // Only fire once per memorandum id -- marking read is idempotent server-side
    // (mhd_mark_memorandum_read only updates a still-null read_at), but this
    // effect should not re-run just because onMarkRead's identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const needsAck = item.requiresAcknowledgment && item.acknowledgmentStatus !== 'SIGNED';

  return (
    <li className="space-y-2 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {mhdFormatMemorandumValue(item.category)}
            {item.publishedAt ? ` · ${new Date(item.publishedAt).toLocaleDateString()}` : ''}
          </p>
        </div>
        {item.requiresAcknowledgment ? (
          <MhdBadge variant={item.acknowledgmentStatus === 'SIGNED' ? 'success' : 'warning'}>
            {item.acknowledgmentStatus === 'SIGNED' ? 'Acknowledged' : 'Acknowledgment Required'}
          </MhdBadge>
        ) : null}
      </div>
      {needsAck ? (
        <Button onClick={onAcknowledge} disabled={acknowledging}>
          {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
        </Button>
      ) : null}
    </li>
  );
}
