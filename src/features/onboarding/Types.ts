import type { MhdFormStatus } from '@/features/forms/Types';

export type MhdUserId = string;
export type MhdOnboardingChecklistStatus =
  'NOT_STARTED' | 'PENDING' | 'SUBMITTED' | 'SIGNED' | 'VOIDED';

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

export interface MhdOnboardingPacketItem
  extends MhdOnboardingChecklistItem, MhdOnboardingPacketDefinition {
  formId: string | null;
  formReferenceId: string | null;
  formStatus: MhdFormStatus | null;
}

export function mhdIsOnboardingDocumentKey(
  value: string | null | undefined,
): value is MhdOnboardingDocumentKey {
  if (!value) return false;
  return value in MHD_ONBOARDING_DOCUMENT_KEY_SET;
}

export const MHD_ONBOARDING_PACKET_DEFINITIONS: MhdOnboardingPacketDefinition[] = [
  {
    documentKey: 'onboarding_direct_deposits',
    label: 'Direct Deposit',
    formName: 'New Hire - Direct Deposit',
    accessTier: 'Restricted',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Banking setup for payroll deposits.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_employment_applications',
    label: 'Employment Application',
    formName: 'New Hire - Employment Application',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Structured employment application intake.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_w4_elections',
    label: 'W-4 Election',
    formName: 'New Hire - W-4 Election',
    accessTier: 'Restricted',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Federal withholding election.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_emergency_contacts',
    label: 'Emergency Contact',
    formName: 'New Hire - Emergency Contact',
    accessTier: 'Standard',
    requiresSignature: false,
    generatedDocumentRequired: false,
    description: 'Emergency contact information for the employee.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_i9_records',
    label: 'Form I-9',
    formName: 'New Hire - I-9',
    accessTier: 'Restricted',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Employment eligibility verification.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_candidate_evaluations',
    label: 'Candidate Evaluation',
    formName: 'New Hire - Candidate Evaluation',
    accessTier: 'Standard',
    requiresSignature: false,
    generatedDocumentRequired: false,
    description: 'Internal interviewer evaluation.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_offer_letters',
    label: 'Offer Letter',
    formName: 'New Hire - Offer Letter',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Offer terms accepted by the employee.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_consumer_report_disclosures',
    label: 'Consumer Report Disclosure',
    formName: 'New Hire - Consumer Report Disclosure',
    accessTier: 'Restricted',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Background check disclosure and authorization.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_harassment_policy_acks',
    label: 'Harassment Policy',
    formName: 'New Hire - Harassment Policy Acknowledgment',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Acknowledgment of harassment policy.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_time_of_hire_pamphlet_acks',
    label: 'Time of Hire Pamphlet',
    formName: 'New Hire - Time of Hire Pamphlet',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Acknowledgment of required time-of-hire pamphlet.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_wage_notice_acks',
    label: 'Wage Notice',
    formName: 'New Hire - Wage Notice',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Wage notice acknowledgment.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_health_marketplace_notice_acks',
    label: 'Health Marketplace Notice',
    formName: 'New Hire - Health Marketplace Notice',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Marketplace notice acknowledgment with variant selection.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_wotc_8850_forms',
    label: 'WOTC Form 8850',
    formName: 'New Hire - WOTC Form 8850',
    accessTier: 'Restricted',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Work Opportunity Tax Credit 8850.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_meal_waiver_acks',
    label: 'Meal Waiver',
    formName: 'New Hire - Meal Waiver',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Meal waiver acknowledgment.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_badge_acknowledgments',
    label: 'Badge Acknowledgment',
    formName: 'New Hire - Badge Acknowledgment',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Badge issuance acknowledgment.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_wotc_9061_forms',
    label: 'WOTC Form 9061',
    formName: 'New Hire - WOTC Form 9061',
    accessTier: 'Restricted',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Work Opportunity Tax Credit 9061.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_self_identification_forms',
    label: 'Voluntary Self-Identification',
    formName: 'New Hire - Voluntary Self-Identification',
    accessTier: 'Restricted',
    requiresSignature: false,
    generatedDocumentRequired: false,
    description: 'Voluntary self-identification and EEO data collection.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_dispute_resolution_acks',
    label: 'Dispute Resolution Policy',
    formName: 'New Hire - Dispute Resolution Policy',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Dispute resolution acknowledgment.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_handbook_acknowledgments',
    label: 'Handbook Acknowledgment',
    formName: 'New Hire - Handbook Acknowledgment',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Employee handbook acknowledgment.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_required_notices_acks',
    label: 'Required Notices',
    formName: 'New Hire - Required Notices',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Acknowledgment of bundled required notices.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_surveillance_policy_acks',
    label: 'Surveillance Policy',
    formName: 'New Hire - Surveillance Policy',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'Surveillance policy acknowledgment.',
    isRequiredByDefault: true,
  },
  {
    documentKey: 'onboarding_at_will_acknowledgments',
    label: 'At-Will Acknowledgment',
    formName: 'New Hire - At-Will Acknowledgment',
    accessTier: 'Standard',
    requiresSignature: true,
    generatedDocumentRequired: true,
    description: 'At-will employment acknowledgment.',
    isRequiredByDefault: true,
  },
];

export const MHD_ONBOARDING_PACKET_BY_KEY: Record<
  MhdOnboardingDocumentKey,
  MhdOnboardingPacketDefinition
> = Object.fromEntries(
  MHD_ONBOARDING_PACKET_DEFINITIONS.map((item) => [item.documentKey, item]),
) as Record<MhdOnboardingDocumentKey, MhdOnboardingPacketDefinition>;

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
