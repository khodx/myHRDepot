import type { MhdCompanyId } from '@/features/companies/Types';
import type { Database, Json } from '@/types/database.types';

type MhdActivityBoardRow =
  Database['public']['Functions']['mhd_list_activity_board']['Returns'][number];
type MhdActivityDetailRow =
  Database['public']['Functions']['mhd_get_activity_by_id']['Returns'][number];
type MhdActivityParticipantRow =
  Database['public']['Functions']['mhd_list_activity_participants']['Returns'][number];
type MhdSubActivityRow =
  Database['public']['Functions']['mhd_list_sub_activities']['Returns'][number];
type MhdActivityMutationRow =
  Database['public']['Functions']['mhd_create_activity']['Returns'][number];
type MhdSubActivityMutationRow =
  Database['public']['Functions']['mhd_create_sub_activity']['Returns'][number];

export type MhdActivityId = string;
export type MhdActivityReferenceId = `ACTV-${string}`;
export type MhdSubActivityId = string;
export type MhdSubActivityReferenceId = `SACT-${string}`;
export type MhdActivityParticipantId = string;
export type MhdActivityParticipantReferenceId = `ACTP-${string}`;

export type MhdActivityType =
  | 'ONE_ON_ONE'
  | 'COACHING_SESSION'
  | 'MEETING'
  | 'PHONE_CALL'
  | 'EMAIL'
  | 'SITE_VISIT'
  | 'COMPANY_EVENT'
  | 'EXIT_INTERVIEW'
  | 'OTHER';

export type MhdActivityStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type MhdSubActivityStatus = Exclude<MhdActivityStatus, 'NO_SHOW'>;
export type MhdActivityParticipantRole = 'FACILITATOR' | 'PARTICIPANT' | 'OBSERVER';

export interface MhdActivity {
  id: MhdActivityId;
  referenceId: MhdActivityReferenceId;
  companyId: MhdCompanyId;
  companyName: string;
  personId: string | null;
  personDisplayName: string | null;
  parentTaskId: string | null;
  activityType: MhdActivityType;
  title: string;
  descriptionPlainText: string | null;
  descriptionRichText: Json | null;
  status: MhdActivityStatus;
  scheduledAt: string | null;
  occurredAt: string | null;
  durationMinutes: number | null;
  location: string | null;
  outcomeSummary: string | null;
  followUpTaskId: string | null;
  linkLabel: string | null;
  linkUrl: string | null;
  isConfidential: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  participantDisplayNames: string[];
  subActivityTotalCount: number;
  subActivityDoneCount: number;
  noteCount: number;
  attachmentCount: number;
}

export interface MhdSubActivity {
  id: MhdSubActivityId;
  referenceId: MhdSubActivityReferenceId;
  activityId: MhdActivityId;
  title: string;
  descriptionPlainText: string | null;
  status: MhdSubActivityStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface MhdActivityParticipant {
  id: MhdActivityParticipantId;
  referenceId: MhdActivityParticipantReferenceId;
  activityId: MhdActivityId;
  userId: string | null;
  personId: string | null;
  participantRole: MhdActivityParticipantRole;
  displayName: string | null;
  createdAt: string;
  createdBy: string;
}

export interface MhdActivityParticipantInput {
  userId?: string | null;
  personId?: string | null;
  role: MhdActivityParticipantRole;
}

export interface MhdActivityFormInput {
  companyId: MhdCompanyId;
  activityType: MhdActivityType;
  title: string;
  personId?: string | null;
  parentTaskId?: string | null;
  descriptionPlainText?: string | null;
  descriptionRichText?: Json | null;
  status?: MhdActivityStatus;
  scheduledAt?: string | null;
  occurredAt?: string | null;
  durationMinutes?: number | null;
  location?: string | null;
  outcomeSummary?: string | null;
  followUpTaskId?: string | null;
  linkLabel?: string | null;
  linkUrl?: string | null;
  isConfidential?: boolean;
  participants?: MhdActivityParticipantInput[];
  actorUserId?: string | null;
}

export interface MhdUpdateActivityInput extends MhdActivityFormInput {
  activityType: MhdActivityType;
  title: string;
}

export interface MhdCreateSubActivityInput {
  activityId: MhdActivityId;
  title: string;
  descriptionPlainText?: string | null;
  scheduledAt?: string | null;
  sortOrder?: number;
}

export interface MhdUpdateSubActivityInput {
  title?: string;
  descriptionPlainText?: string | null;
  status?: MhdSubActivityStatus;
  scheduledAt?: string | null;
  sortOrder?: number;
}

export interface MhdCreateFollowUpTaskInput {
  title: string;
  descriptionPlainText?: string | null;
  descriptionRichText?: Json | null;
}

export interface MhdCompleteActivityInput {
  occurredAt: string;
  durationMinutes?: number | null;
  outcomeSummary?: string | null;
}

export interface MhdActivityBoardFilters {
  companyId: MhdCompanyId | 'ALL';
  personId: string | 'ALL';
  taskId: string | 'ALL';
  activityType: MhdActivityType | 'ALL';
  status: MhdActivityStatus | 'ALL';
  searchTerm: string;
  from: string;
  to: string;
}

export interface MhdActivityOption {
  id: string;
  label: string;
}

export type MhdActivityListRow = MhdActivityBoardRow | MhdActivityDetailRow;
export type MhdActivityParticipantListRow = MhdActivityParticipantRow;
export type MhdSubActivityListRow = MhdSubActivityRow;
export type MhdActivityMutationResultRow = MhdActivityMutationRow;
export type MhdSubActivityMutationResultRow = MhdSubActivityMutationRow;

export const MHD_ACTIVITY_TYPES = [
  'ONE_ON_ONE',
  'COACHING_SESSION',
  'MEETING',
  'PHONE_CALL',
  'EMAIL',
  'SITE_VISIT',
  'COMPANY_EVENT',
  'EXIT_INTERVIEW',
  'OTHER',
] as const satisfies readonly MhdActivityType[];

export const MHD_ACTIVITY_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
] as const satisfies readonly MhdActivityStatus[];

export const MHD_SUB_ACTIVITY_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const satisfies readonly MhdSubActivityStatus[];

export const MHD_ACTIVITY_PARTICIPANT_ROLES = [
  'FACILITATOR',
  'PARTICIPANT',
  'OBSERVER',
] as const satisfies readonly MhdActivityParticipantRole[];

export function mhdFormatActivityType(activityType: MhdActivityType): string {
  const labels: Record<MhdActivityType, string> = {
    ONE_ON_ONE: 'One-on-One',
    COACHING_SESSION: 'Coaching Session',
    MEETING: 'Meeting',
    PHONE_CALL: 'Phone Call',
    EMAIL: 'Email',
    SITE_VISIT: 'Site Visit',
    COMPANY_EVENT: 'Company Event',
    EXIT_INTERVIEW: 'Exit Interview',
    OTHER: 'Other',
  };

  return labels[activityType];
}

export function mhdFormatActivityStatus(status: MhdActivityStatus): string {
  const labels: Record<MhdActivityStatus, string> = {
    PLANNED: 'Planned',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    NO_SHOW: 'No Show',
  };

  return labels[status];
}

export function mhdFormatSubActivityStatus(status: MhdSubActivityStatus): string {
  return mhdFormatActivityStatus(status);
}

export function mhdFormatActivityParticipantRole(role: MhdActivityParticipantRole): string {
  const labels: Record<MhdActivityParticipantRole, string> = {
    FACILITATOR: 'Facilitator',
    PARTICIPANT: 'Participant',
    OBSERVER: 'Observer',
  };

  return labels[role];
}

export function mhdIsActivityOverdue(
  activity: Pick<MhdActivity, 'status' | 'scheduledAt'>,
): boolean {
  return (
    (activity.status === 'PLANNED' || activity.status === 'IN_PROGRESS') &&
    !!activity.scheduledAt &&
    new Date(activity.scheduledAt).getTime() < Date.now()
  );
}
