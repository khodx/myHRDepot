/**
 * Named draft kinds. A kind names the screen a draft belongs to; the draft key names the instance
 * (a new record, or the id of the record being edited). Kinds match the database check
 * `^[A-Z][A-Z0-9_]{2,63}$` (migration 0393).
 */
export const MHD_DRAFT_KINDS = {
  leaveIntake: 'LEAVE_INTAKE',
  leaveCaseHr: 'LEAVE_CASE_HR',
  leaveCaseSelf: 'LEAVE_CASE_SELF',
  leaveTypeForm: 'LEAVE_TYPE_FORM',
  leavePolicySettings: 'LEAVE_POLICY_SETTINGS',
  leaveCaseAction: 'LEAVE_CASE_ACTION',
  accommodationIntake: 'ACCOMMODATION_INTAKE',
  accommodationOptionCatalog: 'ACCOMMODATION_OPTION_CATALOG',
  accommodationCaseAction: 'ACCOMMODATION_CASE_ACTION',
  activityCreate: 'ACTIVITY_CREATE',
  activityEdit: 'ACTIVITY_EDIT',
  activityComplete: 'ACTIVITY_COMPLETE',
  activityFollowUp: 'ACTIVITY_FOLLOW_UP',
  activityParticipant: 'ACTIVITY_PARTICIPANT',
  activityNote: 'ACTIVITY_NOTE',
  activityChecklistItem: 'ACTIVITY_CHECKLIST_ITEM',
  activityAttachment: 'ACTIVITY_ATTACHMENT',
  leaveChecklistItem: 'LEAVE_CHECKLIST_ITEM',
} as const;

export type MhdDraftKind = (typeof MHD_DRAFT_KINDS)[keyof typeof MHD_DRAFT_KINDS];

/** The draft key for a screen that creates a new record. */
export const MHD_DRAFT_NEW_KEY = 'new';

export type MhdDraftPayload = Record<string, unknown>;

export interface MhdDraft {
  id: string;
  draftKind: string;
  draftKey: string;
  title: string | null;
  stepKey: string | null;
  payload: MhdDraftPayload;
  updatedAt: string;
  expiresAt: string;
}

/** Another person's live draft for the same screen instance, visible because the viewer has access to the record. */
export interface MhdSharedDraft extends MhdDraft {
  ownerUserId: string;
  ownerName: string;
}

export interface MhdSaveDraftInput {
  draftKind: MhdDraftKind;
  draftKey: string;
  payload: MhdDraftPayload;
  companyId?: string | null;
  title?: string | null;
  stepKey?: string | null;
}
