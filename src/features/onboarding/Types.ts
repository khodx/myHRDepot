import type { MhdFormStatus } from '@/features/forms/Types';

export type MhdUserId = string;
export type MhdOnboardingChecklistStatus = 'NOT_STARTED' | 'PENDING' | 'SUBMITTED' | 'SIGNED' | 'VOIDED';

export type MhdOnboardingDocumentKey =
  | 'onboarding_direct_deposits'
  | 'onboarding_employment_applications'
  | 'onboarding_w4_elections'
  | 'onboarding_emergency_contacts'
  | 'onboarding_i9_records'
  | 'onboarding_candidate_evaluations'
  | 'onboarding_offer_letters'
  | 'onboarding_consumer_report_disclosures'
  | 'onboarding_harassment_policy_acks'
  | 'onboarding_time_of_hire_pamphlet_acks'
  | 'onboarding_wage_notice_acks'
  | 'onboarding_health_marketplace_notice_acks'
  | 'onboarding_wotc_8850_forms'
  | 'onboarding_meal_waiver_acks'
  | 'onboarding_badge_acknowledgments'
  | 'onboarding_wotc_9061_forms'
  | 'onboarding_self_identification_forms'
  | 'onboarding_dispute_resolution_acks'
  | 'onboarding_handbook_acknowledgments'
  | 'onboarding_required_notices_acks'
  | 'onboarding_surveillance_policy_acks'
  | 'onboarding_at_will_acknowledgments';

export interface MhdOnboardingChecklistItem {
  id: string;
  referenceId: string;
  companyId: string;
  personId: string;
  documentKey: MhdOnboardingDocumentKey;
  documentRecordId: string | null;
  status: MhdOnboardingChecklistStatus;
  isRequired: boolean;
  dueDate: string | null;
  completedAt: string | null;
}

export interface MhdOnboardingChecklistUpsertInput {
  companyId: string;
  personId: string;
  documentKey: MhdOnboardingDocumentKey;
  submissionId: string;
  actorUserId: MhdUserId;
  status?: Exclude<MhdOnboardingChecklistStatus, 'NOT_STARTED'>;
}

export interface MhdOnboardingPacketDefinition {
  documentKey: MhdOnboardingDocumentKey;
  label: string;
  formName: string;
  accessTier: 'Standard' | 'Restricted';
  requiresSignature: boolean;
  generatedDocumentRequired: boolean;
  description: string;
  isRequiredByDefault: boolean;
}

export interface MhdOnboardingPacketFormRef {
  formId: string;
  formReferenceId: string;
  formName: string;
  formStatus: MhdFormStatus;
}

export interface MhdOnboardingPacketItem extends MhdOnboardingChecklistItem, MhdOnboardingPacketDefinition {
  formId: string | null;
  formReferenceId: string | null;
  formStatus: MhdFormStatus | null;
}

export function mhdIsOnboardingDocumentKey(value: string | null | undefined): value is MhdOnboardingDocumentKey {
  if (!value) return false;
  return value in MHD_ONBOARDING_DOCUMENT_KEY_SET;
}

const MHD_ONBOARDING_DOCUMENT_KEY_SET: Record<MhdOnboardingDocumentKey, true> = {
  onboarding_direct_deposits: true,
  onboarding_employment_applications: true,
  onboarding_w4_elections: true,
  onboarding_emergency_contacts: true,
  onboarding_i9_records: true,
  onboarding_candidate_evaluations: true,
  onboarding_offer_letters: true,
  onboarding_consumer_report_disclosures: true,
  onboarding_harassment_policy_acks: true,
  onboarding_time_of_hire_pamphlet_acks: true,
  onboarding_wage_notice_acks: true,
  onboarding_health_marketplace_notice_acks: true,
  onboarding_wotc_8850_forms: true,
  onboarding_meal_waiver_acks: true,
  onboarding_badge_acknowledgments: true,
  onboarding_wotc_9061_forms: true,
  onboarding_self_identification_forms: true,
  onboarding_dispute_resolution_acks: true,
  onboarding_handbook_acknowledgments: true,
  onboarding_required_notices_acks: true,
  onboarding_surveillance_policy_acks: true,
  onboarding_at_will_acknowledgments: true,
};
