import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdCorrespondenceMessage,
  MhdCorrespondenceOrigin,
  MhdCorrespondenceSensitivity,
  MhdCorrespondenceStatus,
  MhdCorrespondenceThread,
  MhdCorrespondenceThreadFilters,
  MhdCorrespondenceThreadWithPreview,
  MhdListCorrespondenceMessagesInput,
  MhdLinkCorrespondenceThreadInput,
  MhdSendCorrespondenceInput,
} from './Types';

type MhdCorrespondenceThreadRow = {
  id: string;
  reference_id: string;
  company_id: string | null;
  mailbox_id: string;
  subject: string | null;
  entity_type: string | null;
  entity_id: string | null;
  subject_person_id: string | null;
  sensitivity_level: string;
  origin: string;
  is_archived: boolean;
  created_by: string | null;
  linked_at: string | null;
  linked_by: string | null;
  created_at: string;
  updated_at: string | null;
  last_message_at: string | null;
};

type MhdCorrespondenceThreadListRow = MhdCorrespondenceThreadRow & {
  last_message_preview: string | null;
};

type MhdCorrespondenceMessageRow = {
  id: string;
  reference_id: string;
  thread_id: string;
  company_id: string;
  direction: string;
  sender_user_id: string | null;
  sender_display_name: string | null;
  sender_email: string;
  recipient_emails: string[] | null;
  cc_emails: string[] | null;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  external_message_id: string | null;
  external_in_reply_to: string | null;
  external_references: string[] | null;
  reply_token: string | null;
  provider_message_id: string | null;
  status: string;
  failure_reason: string | null;
  is_system: boolean;
  created_at: string;
  sent_at: string | null;
  received_at: string | null;
};

type MhdSendEmailResponse = {
  success: boolean;
  status?: string;
  thread_id?: string;
  error?: string | null;
};

function mapThread(row: MhdCorrespondenceThreadRow): MhdCorrespondenceThread {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id ?? null,
    mailboxId: row.mailbox_id,
    subject: row.subject ?? null,
    entityType: row.entity_type ?? null,
    entityId: row.entity_id ?? null,
    subjectPersonId: row.subject_person_id ?? null,
    sensitivityLevel: row.sensitivity_level as MhdCorrespondenceSensitivity,
    origin: row.origin as MhdCorrespondenceOrigin,
    isArchived: row.is_archived,
    createdBy: row.created_by ?? null,
    linkedAt: row.linked_at ?? null,
    linkedBy: row.linked_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    lastMessageAt: row.last_message_at ?? null,
  };
}

function mapMessage(row: MhdCorrespondenceMessageRow): MhdCorrespondenceMessage {
  return {
    id: row.id,
    referenceId: row.reference_id,
    threadId: row.thread_id,
    companyId: row.company_id,
    direction: row.direction as MhdCorrespondenceMessage['direction'],
    senderUserId: row.sender_user_id ?? null,
    senderDisplayName: row.sender_display_name ?? null,
    senderEmail: row.sender_email,
    recipientEmails: row.recipient_emails ?? [],
    ccEmails: row.cc_emails ?? [],
    subject: row.subject ?? null,
    bodyText: row.body_text ?? null,
    bodyHtml: row.body_html ?? null,
    externalMessageId: row.external_message_id ?? null,
    externalInReplyTo: row.external_in_reply_to ?? null,
    externalReferences: row.external_references ?? null,
    replyToken: row.reply_token ?? null,
    providerMessageId: row.provider_message_id ?? null,
    status: row.status as MhdCorrespondenceStatus,
    failureReason: row.failure_reason ?? null,
    isSystem: row.is_system,
    createdAt: row.created_at,
    sentAt: row.sent_at ?? null,
    receivedAt: row.received_at ?? null,
  };
}

export function mhdCorrespondenceHtmlFromText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r?\n/g, '<br>');
}

function mapThreadWithPreview(
  row: MhdCorrespondenceThreadListRow,
): MhdCorrespondenceThreadWithPreview {
  return {
    ...mapThread(row),
    lastMessagePreview: row.last_message_preview ?? null,
  };
}

export const mhdCorrespondenceService = {
  async listThreads(
    filters: MhdCorrespondenceThreadFilters,
  ): Promise<MhdCorrespondenceThreadWithPreview[]> {
    // mhd_list_correspondence_threads computes the preview server-side via a
    // correlated subquery (migration 0155) — do not re-introduce a per-thread
    // mhd_list_correspondence_messages fetch here, that was an N+1 pattern
    // that scaled badly against this query's own 60-second poll interval.
    const { data, error } = await supabaseClient
      .rpc('mhd_list_correspondence_threads', {
        p_company_id: filters.companyId,
        p_entity_type: filters.entityType ?? undefined,
        p_entity_id: filters.entityId ?? undefined,
        p_include_general: filters.includeGeneral ?? false,
        p_limit: filters.limit ?? 50,
        p_offset: filters.offset ?? 0,
      })
      .returns<MhdCorrespondenceThreadListRow[]>();

    if (error) throw new Error('Unable to list correspondence threads: ' + error.message);

    return (data ?? []).map(mapThreadWithPreview);
  },

  async getThread(threadId: string): Promise<MhdCorrespondenceThread> {
    const { data, error } = await supabaseClient.rpc('mhd_get_correspondence_thread', {
      p_thread_id: threadId,
    });

    if (error) throw new Error('Unable to get correspondence thread: ' + error.message);
    return mapThread(data as MhdCorrespondenceThreadRow);
  },

  async listMessages(input: MhdListCorrespondenceMessagesInput): Promise<MhdCorrespondenceMessage[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_correspondence_messages', {
        p_thread_id: input.threadId,
        p_limit: input.limit ?? 100,
        p_offset: input.offset ?? 0,
      })
      .returns<MhdCorrespondenceMessageRow[]>();

    if (error) throw new Error('Unable to list correspondence messages: ' + error.message);
    return (data ?? []).map(mapMessage);
  },

  async send(input: MhdSendCorrespondenceInput): Promise<string> {
    const body = {
      ...(input.threadId ? { thread_id: input.threadId } : {}),
      ...(!input.threadId
        ? {
            company_id: input.companyId,
            ...(input.mailboxId ? { mailbox_id: input.mailboxId } : {}),
            subject: input.subject?.trim(),
            entity_type: input.entityType?.trim() || null,
            entity_id: input.entityId?.trim() || null,
          }
        : {}),
      recipient_emails: input.recipientEmails,
      cc_emails: input.ccEmails ?? [],
      body_html: input.bodyHtml,
      body_text: input.bodyText?.trim() || null,
      in_reply_to_message_id: input.inReplyToMessageId?.trim() || null,
    };

    const { data, error } = await supabaseClient.functions.invoke<MhdSendEmailResponse>(
      'send-email',
      { body },
    );

    if (error) throw new Error('Unable to send correspondence: ' + error.message);
    if (!data?.success) {
      throw new Error(data?.error || 'Unable to send correspondence.');
    }
    if (!data.thread_id) {
      throw new Error('Unable to send correspondence: no thread returned.');
    }
    return data.thread_id;
  },

  async sendFromText(input: Omit<MhdSendCorrespondenceInput, 'bodyHtml'> & { bodyText: string }) {
    return mhdCorrespondenceService.send({
      ...input,
      bodyHtml: mhdCorrespondenceHtmlFromText(input.bodyText),
      bodyText: input.bodyText,
    });
  },

  async linkThread(input: MhdLinkCorrespondenceThreadInput): Promise<MhdCorrespondenceThread> {
    const { data, error } = await supabaseClient.rpc('mhd_link_correspondence_thread', {
      p_thread_id: input.threadId,
      p_entity_type: input.entityType,
      p_entity_id: input.entityId,
    });

    if (error) throw new Error('Unable to link correspondence thread: ' + error.message);
    return mapThread(data as MhdCorrespondenceThreadRow);
  },
};
