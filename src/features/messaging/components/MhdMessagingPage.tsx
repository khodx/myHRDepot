import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdMessageThreads } from '../Hook';
import { MhdMessageThreadList } from './MhdMessageThreadList';
import { MhdMessageThreadView } from '@/components/ui/MhdMessageThreadView';
import { MhdNewMessageDialog } from './MhdNewMessageDialog';
import { MhdCommunicationsTabs } from '@/appshell/components/MhdCommunicationsTabs';

export function MhdMessagingPage() {
  const { profile, authUserId } = useMhdAuth();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const threads = useMhdMessageThreads({ limit: 100 });
  const activeThreadId = selectedThreadId ?? threads.data?.[0]?.id ?? null;

  return (
    <div className="mx-auto max-w-[104rem] space-y-6">
      <MhdPageHeader
        title="Messaging"
        description="Direct and module-related conversations."
        backTo="/communications"
        backLabel="Communications"
        actions={
          <Button onClick={() => setComposeOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New
          </Button>
        }
      />

      <MhdCommunicationsTabs active="messaging" />

      <section className="grid min-h-[36rem] gap-4 xl:grid-cols-[24rem_1fr]">
        <MhdCard className="overflow-hidden p-0">
          <div className="border-b border-border p-4">
            <h2 className="text-sm font-semibold text-foreground">Inbox</h2>
            {threads.error && (
              <p className="mt-1 text-xs text-red-600">
                {threads.error instanceof Error ? threads.error.message : 'Unable to load inbox.'}
              </p>
            )}
          </div>
          <MhdMessageThreadList
            threads={threads.data ?? []}
            selectedThreadId={activeThreadId}
            isLoading={threads.isLoading}
            currentUserId={authUserId}
            onSelect={setSelectedThreadId}
          />
        </MhdCard>

        <MhdMessageThreadView threadId={activeThreadId} currentUserId={authUserId} />
      </section>

      <MhdNewMessageDialog
        open={composeOpen}
        companyId={profile?.companyId ?? null}
        currentUserId={authUserId}
        onClose={() => setComposeOpen(false)}
        onCreated={setSelectedThreadId}
      />
    </div>
  );
}
