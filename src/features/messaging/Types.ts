export type MhdThreadType = 'DIRECT' | 'MODULE';
export type MhdMessageThreadParticipantRole = 'OWNER' | 'MEMBER';

export interface MhdMessageThread {
  id: string;
  referenceId: string;
  companyId: string;
  subject: string | null;
  threadType: MhdThreadType;
  entityType: string | null;
  entityId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  lastMessageAt: string | null;
  isArchived: boolean;
}

export interface MhdMessageThreadParticipant {
  id: string;
  threadId: string;
  userId: string;
  role: MhdMessageThreadParticipantRole;
  lastReadAt: string | null;
  isMuted: boolean;
  joinedAt: string;
  leftAt: string | null;
}

export interface MhdMessage {
  id: string;
  referenceId: string;
  threadId: string;
  companyId: string;
  senderUserId: string;
  body: string | null;
  isSystem: boolean;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  parentMessageId: string | null;
  replyCount: number;
}

export interface MhdMessageThreadParticipantSummary {
  userId: string;
  displayName: string;
}

export interface MhdMessageThreadWithMeta extends MhdMessageThread {
  unreadCount: number;
  participantCount: number;
  participants: MhdMessageThreadParticipantSummary[];
  lastMessageBody: string | null;
}

export interface MhdMessageThreadDetail extends MhdMessageThread {
  participants: MhdMessageThreadParticipant[];
}

export interface MhdMessagingState {
  threads: MhdMessageThreadWithMeta[];
  selectedThread: MhdMessageThreadDetail | null;
  messages: MhdMessage[];
  isLoading: boolean;
  error: string | null;
}

export interface MhdMessageThreadFilters {
  threadType?: MhdThreadType | null;
  entityType?: string | null;
  entityId?: string | null;
  includeArchived?: boolean;
  limit?: number;
}

export interface MhdCreateMessageThreadInput {
  companyId: string;
  threadType: MhdThreadType;
  subject?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  participantUserIds: string[];
  initialBody: string;
}

export interface MhdSendMessageInput {
  threadId: string;
  body: string;
  parentMessageId?: string | null;
}

export interface MhdListMessagesInput {
  threadId: string;
  limit?: number;
  before?: string | null;
}

export interface MhdListMessageRepliesInput {
  parentMessageId: string;
  limit?: number;
}

export interface MhdGetOrCreateEntityMessageThreadInput {
  entityType: string;
  entityId: string;
  companyId: string;
  initialParticipantUserIds?: string[];
}
