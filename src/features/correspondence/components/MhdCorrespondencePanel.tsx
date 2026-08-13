import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { useMhdCorrespondenceThreads } from '../Hook';
import { MhdCorrespondenceThreadList } from './MhdCorrespondenceThreadList';
import { MhdCorrespondenceThreadView } from './MhdCorrespondenceThreadView';
import { MhdNewCorrespondenceDialog } from './MhdNewCorrespondenceDialog';

type Props =
  | {
      companyId: string;
      entityType: string;
      entityId: string;
    }
  | {
      companyId: string;
      entityType?: undefined;
      entityId?: undefined;
    };

export function MhdCorrespondencePanel({ companyId, entityType, entityId }: Props) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const isEmbeddedMode = Boolean(entityType && entityId);
  const filters = useMemo(
    () => ({
      companyId,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      includeGeneral: !isEmbeddedMode,
      limit: 100,
    }),
    [companyId, entityId, entityType, isEmbeddedMode],
  );
  const threads = useMhdCorrespondenceThreads(filters);
  const activeThreadId = selectedThreadId ?? threads.data?.[0]?.id ?? null;

  return (
    <section className="grid min-h-[36rem] gap-4 xl:grid-cols-[24rem_1fr]">
      <MhdCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {isEmbeddedMode ? 'Correspondence' : 'Inbox'}
            </h2>
            {threads.error ? (
              <p className="mt-1 text-xs text-red-600">
                {threads.error instanceof Error
                  ? threads.error.message
                  : 'Unable to load correspondence.'}
              </p>
            ) : null}
          </div>
          <Button onClick={() => setComposeOpen(true)} className="shrink-0">
            <Plus className="h-4 w-4" aria-hidden />
            New
          </Button>
        </div>
        <MhdCorrespondenceThreadList
          threads={threads.data ?? []}
          selectedThreadId={activeThreadId}
          isLoading={threads.isLoading}
          showLinkBadges={!isEmbeddedMode}
          onSelect={setSelectedThreadId}
        />
      </MhdCard>

      <MhdCorrespondenceThreadView threadId={activeThreadId} allowLinkAction={!isEmbeddedMode} />

      <MhdNewCorrespondenceDialog
        open={composeOpen}
        companyId={companyId}
        entityType={entityType}
        entityId={entityId}
        onClose={() => setComposeOpen(false)}
        onCreated={setSelectedThreadId}
      />
    </section>
  );
}
