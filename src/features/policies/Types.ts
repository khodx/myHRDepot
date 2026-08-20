export type MhdPolicyCategory =
  | 'WORKPLACE_CONDUCT'
  | 'ATTENDANCE'
  | 'COMPENSATION'
  | 'BENEFITS'
  | 'SAFETY'
  | 'TECHNOLOGY'
  | 'LEAVE'
  | 'GENERAL'
  | 'OTHER';

export type MhdPolicyAckStatus = 'PENDING' | 'SUBMITTED' | 'SIGNED' | 'VOIDED';

export const MHD_POLICY_CATEGORIES: readonly MhdPolicyCategory[] = [
  'WORKPLACE_CONDUCT',
  'ATTENDANCE',
  'COMPENSATION',
  'BENEFITS',
  'SAFETY',
  'TECHNOLOGY',
  'LEAVE',
  'GENERAL',
  'OTHER',
];

export interface MhdPolicyRpcRow {
  id: string;
  company_id: string | null;
  source_policy_id: string | null;
  title: string;
  category: MhdPolicyCategory;
  jurisdiction: string | null;
  is_active: boolean;
  is_library: boolean;
  current_version_id: string | null;
}

export interface MhdPolicy {
  id: string;
  companyId: string | null;
  sourcePolicyId: string | null;
  title: string;
  category: MhdPolicyCategory;
  jurisdiction: string | null;
  isActive: boolean;
  isLibrary: boolean;
  currentVersionId: string | null;
}

export interface MhdPolicyMutationRpcRow {
  id: string;
}

export interface MhdMyPolicyAcknowledgmentRpcRow {
  id: string;
  reference_id: string;
  policy_title: string;
  policy_version_id: string;
  status: string;
  assigned_at: string;
  signed_at: string | null;
}

export interface MhdMyPolicyAcknowledgment {
  id: string;
  referenceId: string;
  policyTitle: string;
  policyVersionId: string;
  status: MhdPolicyAckStatus;
  assignedAt: string;
  signedAt: string | null;
}

export interface MhdPolicyAckBoardRpcRow {
  id: string;
  person_id: string;
  status: string;
  assigned_at: string;
  signed_at: string | null;
}

export interface MhdPolicyAckBoardRow {
  id: string;
  personId: string;
  status: MhdPolicyAckStatus;
  assignedAt: string;
  signedAt: string | null;
}

export interface MhdCreatePolicyInput {
  companyId: string | null;
  title: string;
  category?: MhdPolicyCategory;
  jurisdiction?: string | null;
  sourcePolicyId?: string | null;
}

export interface MhdForkPolicyInput {
  sourcePolicyId: string;
  companyId: string;
}

export interface MhdPublishPolicyVersionInput {
  policyId: string;
  content: string;
  requiresSignature: boolean;
}

export interface MhdAssignPolicyAcknowledgmentInput {
  policyVersionId: string;
  personIds: string[];
}

export interface MhdAcknowledgePolicyInput {
  acknowledgmentId: string;
  esignatureRequestId?: string | null;
}

export function mhdFormatPolicyValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
