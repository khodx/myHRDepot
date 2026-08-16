import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdMessageThreadView } from '@/components/ui/MhdMessageThreadView';
import { useMhdEntityMessageThread } from '@/features/messaging/Hook';

interface MhdEntityMessagingPanelProps {
  entityType: string;
  entityId: string;
  companyId: string | null;
  currentUserId: string | null;
  defaultExpanded?: boolean;
}

/**
 * Embeddable messaging panel for a record in another feature (Task, Activity,
 * Leave case, Accommodation case, Subtask, Form submission). Lazily resolves
 * (and, on first use, creates) the record's MODULE message thread via
 * mhd_get_or_create_entity_message_thread only once expanded - collapsed by
 * default so merely viewing a record's page never silently auto-joins the
 * viewer to a conversation they haven't opened.
 */
export function MhdEntityMessagingPanel({
  entityType,
  entityId,
  companyId,
  currentUserId,
  defaultExpanded = false,
}: MhdEntityMessagingPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const thread = useMhdEntityMessageThread(
    expanded && companyId ? { entityType, entityId, companyId } : null,
  );

  return (
    <MhdCard className="space-y-3">
      <MhdCardHeader
        title="Messages"
        action={
          <Button
            type="button"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            )}
            {expanded ? 'Hide' : 'Show'}
          </Button>
        }
      />
      {expanded &&
        (thread.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        ) : thread.error ? (
          <p className="text-sm text-red-600">
            {thread.error instanceof Error ? thread.error.message : 'Unable to load messages.'}
          </p>
        ) : thread.data ? (
          <MhdMessageThreadView threadId={thread.data} currentUserId={currentUserId} />
        ) : null)}
    </MhdCard>
  );
}
