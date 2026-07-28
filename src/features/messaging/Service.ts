import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdCreateMessageThreadInput,
  MhdListMessagesInput,
  MhdMessage,
  MhdMessageThread,
  MhdMessageThreadDetail,
  MhdMessageThreadFilters,
  MhdMessageThreadParticipant,
  MhdMessageThreadParticipantRole,
  MhdMessageThreadWithMeta,
  MhdSendMessageInput,
  MhdThreadType,
} from './Types';

type MhdMessageThreadRow = {
  id: string;
  reference_id: string;
  company_id: string;
  subject: string | null;
  thread_type: string;
  entity_type: string | null;
  entity_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  last_message_at: string | null;
  is_archived: boolean;
};

type MhdMessageThreadListRow = MhdMessageThreadRow & {
  unread_count: number;
  participant_count: number;
  last_message_body: string | null;
};

type MhdMessageThreadParticipantRow = {
  id: string;
  thread_id: string;
  user_id: string;
  role: string;
  last_read_at: string | null;
  is_muted: boolean;
  joined_at: string;
  left_at: string | null;
};

type MhdMessageRow = {
  id: string;
  reference_id: string;
  thread_id: string;
  company_id: string;
  sender_user_id: string;
  body: string | null;
  is_system: boolean;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

type MhdMessageThreadDetailRow = MhdMessageThreadRow & {
  participants?: MhdMessageThreadParticipantRow[];
};

function mapMessageThread(row: MhdMessageThreadRow): MhdMessageThread {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    subject: row.subject ?? null,
    threadType: row.thread_type as MhdThreadType,
    entityType: row.entity_type ?? null,
    entityId: row.entity_id ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    lastMessageAt: row.last_message_at ?? null,
    isArchived: row.is_archived,
  };
}

function mapMessageThreadWithMeta(row: MhdMessageThreadListRow): MhdMessageThreadWithMeta {
  return {
    ...mapMessageThread(row),
    unreadCount: row.unread_count ?? 0,
    participantCount: row.participant_count ?? 0,
    lastMessageBody: row.last_message_body ?? null,
  };
}

function mapParticipant(row: MhdMessageThreadParticipantRow): MhdMessageThreadParticipant {
  return {
    id: row.id,
    threadId: row.thread_id,
    userId: row.user_id,
    role: row.role as MhdMessageThreadParticipantRole,
    lastReadAt: row.last_read_at ?? null,
    isMuted: row.is_muted,
    joinedAt: row.joined_at,
    leftAt: row.left_at ?? null,
  };
}

function mapMessage(row: MhdMessageRow): MhdMessage {
  return {
    id: row.id,
    referenceId: row.reference_id,
    threadId: row.thread_id,
    companyId: row.company_id,
    senderUserId: row.sender_user_id,
    body: row.body ?? null,
    isSystem: row.is_system,
    createdAt: row.created_at,
    editedAt: row.edited_at ?? null,
    deletedAt: row.deleted_at ?? null,
  };
}

function normalizeThreadDetail(data: unknown): MhdMessageThreadDetail {
  const row = data as MhdMessageThreadDetailRow;
  return {
    ...mapMessageThread(row),
    participants: (row.participants ?? []).map(mapParticipant),
  };
}

export const mhdMessagingService = {
  async listThreads(filters: MhdMessageThreadFilters = {}): Promise<MhdMessageThreadWithMeta[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_message_threads', {
        p_thread_type: filters.threadType ?? undefined,
        p_entity_type: filters.entityType ?? undefined,
        p_entity_id: filters.entityId ?? undefined,
        p_include_archived: filters.includeArchived ?? false,
        p_limit: filters.limit ?? 50,
      })
      .returns<MhdMessageThreadListRow[]>();

    if (error) throw new Error('Unable to list message threads: ' + error.message);
    return (data ?? []).map(mapMessageThreadWithMeta);
  },

  async getThread(threadId: string): Promise<MhdMessageThreadDetail> {
    const { data, error } = await supabaseClient.rpc('mhd_get_message_thread', {
      p_thread_id: threadId,
    });

    if (error) throw new Error('Unable to get message thread: ' + error.message);
    return normalizeThreadDetail(data);
  },

  async listMessages(input: MhdListMessagesInput): Promise<MhdMessage[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_messages', {
        p_thread_id: input.threadId,
        p_limit: input.limit ?? 100,
        p_before: input.before ?? undefined,
      })
      .returns<MhdMessageRow[]>();

    if (error) throw new Error('Unable to list messages: ' + error.message);
    return (data ?? []).map(mapMessage);
  },

  async createThread(input: MhdCreateMessageThreadInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_create_message_thread', {
      p_company_id: input.companyId,
      p_thread_type: input.threadType,
      p_subject: (input.subject?.trim() || null) as string,
      p_entity_type: (input.entityType?.trim() || null) as string,
      p_entity_id: (input.entityId || null) as string,
      p_participant_user_ids: input.participantUserIds,
      p_initial_body: input.initialBody.trim(),
    });

    if (error) throw new Error('Unable to create message thread: ' + error.message);
    return data as string;
  },

  async sendMessage(input: MhdSendMessageInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_send_message', {
      p_thread_id: input.threadId,
      p_body: input.body.trim(),
    });

    if (error) throw new Error('Unable to send message: ' + error.message);
    return data as string;
  },

  async editMessage(messageId: string, body: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_edit_message', {
      p_message_id: messageId,
      p_body: body.trim(),
    });

    if (error) throw new Error('Unable to edit message: ' + error.message);
  },

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_message', {
      p_message_id: messageId,
    });

    if (error) throw new Error('Unable to delete message: ' + error.message);
  },

  async markThreadRead(threadId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_mark_thread_read', {
      p_thread_id: threadId,
    });

    if (error) throw new Error('Unable to mark thread read: ' + error.message);
  },

  async addParticipants(threadId: string, userIds: string[]): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_add_message_thread_participants', {
      p_thread_id: threadId,
      p_user_ids: userIds,
    });

    if (error) throw new Error('Unable to add message thread participants: ' + error.message);
  },

  async removeParticipant(threadId: string, userId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_remove_message_thread_participant', {
      p_thread_id: threadId,
      p_user_id: userId,
    });

    if (error) throw new Error('Unable to remove message thread participant: ' + error.message);
  },

  async archiveThread(threadId: string, isArchived: boolean): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_archive_message_thread', {
      p_thread_id: threadId,
      p_is_archived: isArchived,
    });

    if (error) throw new Error('Unable to archive message thread: ' + error.message);
  },
};
