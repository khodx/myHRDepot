export type MhdMemorandumStatus = 'DRAFT' | 'PUBLISHED';

export type MhdMemorandumCategory =
  | 'GENERAL'
  | 'POLICY_UPDATE'
  | 'FACILITIES'
  | 'SAFETY'
  | 'BENEFITS'
  | 'ORGANIZATIONAL'
  | 'COMPLIANCE'
  | 'OTHER';

export const MHD_MEMORANDUM_CATEGORIES: readonly MhdMemorandumCategory[] = [
  'GENERAL',
  'POLICY_UPDATE',
  'FACILITIES',
  'SAFETY',
  'BENEFITS',
  'ORGANIZATIONAL',
  'COMPLIANCE',
  'OTHER',
];

export interface MhdMemorandumListItemRpcRow {
  id: string;
  reference_id: string;
  title: string;
  category: MhdMemorandumCategory;
  requires_acknowledgment: boolean;
  status: MhdMemorandumStatus;
  audience_label: string | null;
  published_at: string | null;
  created_at: string;
  recipient_count: number | string;
}

export interface MhdMemorandumListItem {
  id: string;
  referenceId: string;
  title: string;
  category: MhdMemorandumCategory;
  requiresAcknowledgment: boolean;
  status: MhdMemorandumStatus;
  audienceLabel: string | null;
  publishedAt: string | null;
  createdAt: string;
  recipientCount: number;
}

export interface MhdMemorandumDetailRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  title: string;
  body: string;
  category: MhdMemorandumCategory;
  requires_acknowledgment: boolean;
  status: MhdMemorandumStatus;
  audience_label: string | null;
  published_at: string | null;
  created_at: string;
}

export interface MhdMemorandumDetail {
  id: string;
  referenceId: string;
  companyId: string;
  title: string;
  body: string;
  category: MhdMemorandumCategory;
  requiresAcknowledgment: boolean;
  status: MhdMemorandumStatus;
  audienceLabel: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface MhdMyMemorandumRpcRow {
  id: string;
  reference_id: string;
  title: string;
  category: MhdMemorandumCategory;
  requires_acknowledgment: boolean;
  published_at: string | null;
  read_at: string | null;
  acknowledgment_id: string | null;
  acknowledgment_status: string | null;
}

export interface MhdMyMemorandum {
  id: string;
  referenceId: string;
  title: string;
  category: MhdMemorandumCategory;
  requiresAcknowledgment: boolean;
  publishedAt: string | null;
  readAt: string | null;
  acknowledgmentId: string | null;
  acknowledgmentStatus: string | null;
}

export interface MhdMemorandumDeliveryRpcRow {
  person_id: string;
  delivered_at: string;
  read_at: string | null;
  acknowledgment_status: string | null;
}

export interface MhdMemorandumDelivery {
  personId: string;
  deliveredAt: string;
  readAt: string | null;
  acknowledgmentStatus: string | null;
}

export interface MhdCreateMemorandumInput {
  companyId: string;
  title: string;
  body: string;
  category?: MhdMemorandumCategory;
  requiresAcknowledgment?: boolean;
}

export interface MhdPublishMemorandumInput {
  memorandumId: string;
  recipientPersonIds: string[];
  audienceLabel?: string | null;
  sendEmail?: boolean;
}

export function mhdFormatMemorandumValue(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
