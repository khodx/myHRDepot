export type MhdCorrespondenceDirection = 'OUTBOUND' | 'INBOUND';
export type MhdCorrespondenceOrigin = 'OUTBOUND' | 'INBOUND';
export type MhdCorrespondenceStatus = 'DRAFT' | 'QUEUED' | 'SENT' | 'FAILED' | 'RECEIVED';
export type MhdCorrespondenceSensitivity =
  | 'STANDARD'
  | 'RESTRICTED'
  | 'MEDICAL'
  | 'IMPLEMENTATION';

export const MHD_CORRESPONDENCE_ENTITY_TYPES = [
  'ACCOMMODATION_CASE',
  'RECRUITING_APPLICATION',
  'LEAVE_CASE',
] as const;

export type MhdCorrespondenceEntityType = (typeof MHD_CORRESPONDENCE_ENTITY_TYPES)[number];

export interface MhdCorrespondenceThread {
  id: string;
  referenceId: string;
  companyId: string | null;
  mailboxId: string;
  subject: string | null;
  entityType: string | null;
  entityId: string | null;
  subjectPersonId: string | null;
  sensitivityLevel: MhdCorrespondenceSensitivity;
  origin: MhdCorrespondenceOrigin;
  isArchived: boolean;
  createdBy: string | null;
  linkedAt: string | null;
  linkedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  lastMessageAt: string | null;
}

export interface MhdCorrespondenceThreadWithPreview extends MhdCorrespondenceThread {
  lastMessagePreview: string | null;
}

export interface MhdCorrespondenceMessage {
  id: string;
  referenceId: string;
  threadId: string;
  companyId: string;
  direction: MhdCorrespondenceDirection;
  senderUserId: string | null;
  senderDisplayName: string | null;
  senderEmail: string;
  recipientEmails: string[];
  ccEmails: string[];
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  externalMessageId: string | null;
  externalInReplyTo: string | null;
  externalReferences: string[] | null;
  replyToken: string | null;
  providerMessageId: string | null;
  status: MhdCorrespondenceStatus;
  failureReason: string | null;
  isSystem: boolean;
  createdAt: string;
  sentAt: string | null;
  receivedAt: string | null;
}

export interface MhdCorrespondenceThreadFilters {
  companyId: string;
  entityType?: string | null;
  entityId?: string | null;
  includeGeneral?: boolean;
  limit?: number;
  offset?: number;
}

export interface MhdListCorrespondenceMessagesInput {
  threadId: string;
  limit?: number;
  offset?: number;
}

export interface MhdSendCorrespondenceInput {
  threadId?: string;
  companyId?: string;
  mailboxId?: string | null;
  subject?: string;
  entityType?: string | null;
  entityId?: string | null;
  recipientEmails: string[];
  ccEmails?: string[];
  bodyHtml: string;
  bodyText?: string | null;
  inReplyToMessageId?: string | null;
}

export interface MhdLinkCorrespondenceThreadInput {
  threadId: string;
  entityType: MhdCorrespondenceEntityType;
  entityId: string;
}
