import { MessageSquare } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';

export function MhdMessagingPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <MhdPageHeader
        title="Messaging"
        description="Conversation design surface for direct and module-related messages."
        backTo="/communications"
        backLabel="Communications"
      />

      <MhdCard className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-accent-tint p-3 text-accent">
            <MessageSquare className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Messaging Engine Required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              I found a live notification engine, but I did not find messaging/conversation tables,
              recipient routing, send/reply RPCs, delivery status, or a message service. This page is
              therefore a designed placeholder until the engine exists.
            </p>
          </div>
        </div>
      </MhdCard>

      <div className="grid gap-4 md:grid-cols-3">
        {['Inbox', 'Sent Messages', 'Module Threads'].map((label) => (
          <MhdCard key={label} className="border-dashed p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{label}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Waiting On Messaging Schema And Service Layer.
            </p>
          </MhdCard>
        ))}
      </div>
    </div>
  );
}
