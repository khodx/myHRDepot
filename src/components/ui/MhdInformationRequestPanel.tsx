import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdDateField } from '@/components/ui/MhdDateField';
import { MhdDraftBanner, MhdSaveDraftButton } from '@/components/ui/MhdDraftControls';
import { MhdFormModal } from '@/components/ui/MhdFormModal';
import { mhdAccommodationsIsPrivileged, mhdLeavesIsPrivileged } from '@/appshell/mhdRouteAccess';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCreateInformationRequest,
  useMhdInformationRequests,
  useMhdInformationRequestThread,
  useMhdRespondToInformationRequest,
} from '@/features/benefit-intake/Hook';
import {
  mhdInformationRequestSchema,
  mhdInformationResponseSchema,
} from '@/features/benefit-intake/Schemas';
import type { MhdBenefitCaseType, MhdInformationRequest } from '@/features/benefit-intake/Types';
import { useMhdDraft } from '@/features/drafts/Hook';
import { MHD_DRAFT_KINDS, type MhdDraftPayload } from '@/features/drafts/Types';

const NO_MEDICAL_DETAIL_HELP =
  'Do not enter a diagnosis, the cause of a condition, genetic information, or medical records.';

const STATUS_LABEL: Record<string, string> = {
  PLANNED: 'Awaiting Response',
  IN_PROGRESS: 'Answered',
  COMPLETED: 'Closed',
};

function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
}

interface MhdInformationRequestPanelProps {
  caseType: MhdBenefitCaseType;
  caseId: string;
  /** The person the case is for; only that person can respond to a request. */
  personId?: string | null;
}

/**
 * Information requests on a leave or accommodation case. Administrators ask a question with a due
 * date; the case's own person answers it. Each request is a confidential activity plus a follow-up
 * task, so HR works the answer like any other activity.
 */
export function MhdInformationRequestPanel({
  caseType,
  caseId,
  personId,
}: MhdInformationRequestPanelProps) {
  const { profile, roles } = useMhdAuth();
  const isAdministrator =
    caseType === 'LEAVE' ? mhdLeavesIsPrivileged(roles) : mhdAccommodationsIsPrivileged(roles);
  const isOwnCase = Boolean(profile?.personId && profile.personId === personId);
  const requests = useMhdInformationRequests(caseType, caseId);
  const [asking, setAsking] = useState(false);
  const [responding, setResponding] = useState<MhdInformationRequest | null>(null);
  const items = requests.data ?? [];

  if (!isAdministrator && !isOwnCase) return null;

  return (
    <MhdCard className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <MhdCardHeader title="Information Requests" />
        {isAdministrator ? (
          <Button variant="secondary" onClick={() => setAsking(true)}>
            Request More Information
          </Button>
        ) : null}
      </div>
      {requests.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {requests.error ? (
        <p role="alert" className="text-sm text-red-700">
          {requests.error.message}
        </p>
      ) : null}
      {!requests.isLoading && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No information requests.</p>
      ) : null}
      <ul className="space-y-2">
        {items.map((request) => (
          <li key={request.activityId} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MhdBadge variant={request.status === 'COMPLETED' ? 'neutral' : 'warning'}>
                {STATUS_LABEL[request.status] ?? request.status}
              </MhdBadge>
              <span className="text-xs text-muted-foreground">
                Due {formatDate(request.dueAt)} · Requested {formatDate(request.createdAt)}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{request.question}</p>
            <div className="flex flex-wrap items-center gap-2">
              {isOwnCase && request.status !== 'COMPLETED' ? (
                <Button variant="secondary" onClick={() => setResponding(request)}>
                  Respond
                </Button>
              ) : null}
              {isAdministrator ? (
                <>
                  <Button variant="secondary" onClick={() => setResponding(request)}>
                    View Responses
                  </Button>
                  <Link
                    className="inline-flex items-center text-sm text-accent underline"
                    to={`/activities/${request.activityId}`}
                  >
                    Open Activity
                  </Link>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {asking ? (
        <MhdAskDialog
          caseType={caseType}
          caseId={caseId}
          companyId={profile?.companyId ?? null}
          onClose={() => setAsking(false)}
        />
      ) : null}
      {responding ? (
        <MhdRespondDialog
          request={responding}
          canRespond={isOwnCase && responding.status !== 'COMPLETED'}
          onClose={() => setResponding(null)}
        />
      ) : null}
    </MhdCard>
  );
}

interface MhdAskDialogProps {
  caseType: MhdBenefitCaseType;
  caseId: string;
  companyId: string | null;
  onClose: () => void;
}

// Mounted only while open, so every opening starts with a fresh form and draft status.
function MhdAskDialog({ caseType, caseId, companyId, onClose }: MhdAskDialogProps) {
  const create = useMhdCreateInformationRequest();
  const draft = useMhdDraft({
    draftKind:
      caseType === 'LEAVE'
        ? MHD_DRAFT_KINDS.leaveCaseAction
        : MHD_DRAFT_KINDS.accommodationCaseAction,
    draftKey: `${caseId}:INFO_REQUEST`,
    companyId,
  });
  const [question, setQuestion] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  function restore(payload: MhdDraftPayload) {
    setQuestion(typeof payload.question === 'string' ? payload.question : '');
    setDueDate(typeof payload.dueDate === 'string' ? payload.dueDate : '');
  }

  async function send() {
    setError(null);
    const parsed = mhdInformationRequestSchema.safeParse({ caseType, caseId, question, dueDate });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the request and try again.');
      return;
    }
    try {
      await create.mutateAsync(parsed.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request could not be sent.');
      return;
    }
    try {
      await draft.discard();
    } catch (caught) {
      setError(
        `Sent, but the draft could not be removed: ${caught instanceof Error ? caught.message : 'unknown error'}`,
      );
      return;
    }
    onClose();
  }

  return (
    <MhdFormModal
      title="Request More Information"
      description="The employee is notified and a follow-up task is created for you."
      onClose={onClose}
      size="md"
    >
      <MhdDraftBanner draft={draft} onRestore={restore} />
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Question
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-border bg-background p-2 text-sm font-normal"
            value={question}
            maxLength={1000}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <span className="block text-xs font-normal text-muted-foreground">
            {NO_MEDICAL_DETAIL_HELP}
          </span>
        </label>
        <label className="block text-sm font-medium">
          Response due
          <MhdDateField className="mt-1" value={dueDate} onChange={setDueDate} />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={create.isPending} onClick={() => void send()}>
            {create.isPending ? 'Sending…' : 'Send Request'}
          </Button>
          <MhdSaveDraftButton draft={draft} getValues={() => ({ question, dueDate })} />
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </MhdFormModal>
  );
}

interface MhdRespondDialogProps {
  request: MhdInformationRequest;
  canRespond: boolean;
  onClose: () => void;
}

function MhdRespondDialog({ request, canRespond, onClose }: MhdRespondDialogProps) {
  const respond = useMhdRespondToInformationRequest();
  const thread = useMhdInformationRequestThread(request.activityId);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    const parsed = mhdInformationResponseSchema.safeParse({
      activityId: request.activityId,
      response,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a response.');
      return;
    }
    try {
      await respond.mutateAsync(parsed.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The response could not be sent.');
      return;
    }
    onClose();
  }

  return (
    <MhdFormModal title="Information Request" onClose={onClose} size="md">
      <div className="space-y-3">
        <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{request.question}</p>
        {thread.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
        {thread.error ? (
          <p role="alert" className="text-sm text-red-700">
            {thread.error.message}
          </p>
        ) : null}
        <ul className="space-y-2">
          {(thread.data ?? []).map((note) => (
            <li key={note.noteId} className="rounded-md border border-border p-2 text-sm">
              <span className="block text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString()}
              </span>
              <span className="whitespace-pre-wrap">{note.text}</span>
            </li>
          ))}
        </ul>
        {canRespond ? (
          <>
            <label className="block text-sm font-medium">
              Your response
              <textarea
                className="mt-1 min-h-24 w-full rounded-md border border-border bg-background p-2 text-sm font-normal"
                value={response}
                onChange={(event) => setResponse(event.target.value)}
              />
              <span className="block text-xs font-normal text-muted-foreground">
                {NO_MEDICAL_DETAIL_HELP}
              </span>
            </label>
            {error ? (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <Button disabled={respond.isPending} onClick={() => void send()}>
                {respond.isPending ? 'Sending…' : 'Send Response'}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
    </MhdFormModal>
  );
}
