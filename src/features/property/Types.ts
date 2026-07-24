import type { Database } from '@/types/database.types';

type DbFunctions = Database['public']['Functions'];

export type MhdPropertyItemId = string;
export type MhdPropertyItemReferenceId = `PROP-${string}`;
export type MhdPropertyAssignmentId = string;
export type MhdPropertyAssignmentReferenceId = `PASN-${string}`;

export type MhdPropertyCategory =
  'EQUIPMENT' | 'ELECTRONICS' | 'VEHICLE' | 'KEY' | 'UNIFORM' | 'TOOL' | 'OTHER';

export type MhdPropertyItemStatus = 'IN_STOCK' | 'ASSIGNED' | 'RETIRED' | 'LOST' | 'DAMAGED';
export type MhdPropertyAssignmentStatus = 'ISSUED' | 'RETURNED' | 'LOST' | 'DAMAGED';
export type MhdPropertyDispositionStatus = Extract<MhdPropertyAssignmentStatus, 'LOST' | 'DAMAGED'>;

export interface MhdPropertyItem {
  id: MhdPropertyItemId;
  referenceId: MhdPropertyItemReferenceId;
  companyId: string;
  category: MhdPropertyCategory;
  name: string;
  description: string | null;
  serialNumber: string | null;
  quantityTotal: number;
  quantityAvailable: number;
  unitCost: number | null;
  acquisitionDate: string | null;
  status: MhdPropertyItemStatus;
  conditionNotes: string | null;
  createdAt: string;
  createdBy: string;
}

export interface MhdPropertyAssignment {
  id: MhdPropertyAssignmentId;
  referenceId: MhdPropertyAssignmentReferenceId;
  companyId: string;
  propertyItemId: MhdPropertyItemId;
  personId: string;
  itemName: string;
  personDisplayName: string;
  quantity: number;
  status: MhdPropertyAssignmentStatus;
  issuedAt: string;
  issuedBy: string;
  issuerDisplayName: string | null;
  issuerTitle: string | null;
  issuanceConditionNotes: string | null;
  employeeAckReceipt: boolean;
  employeeAckMaintain: boolean;
  employeeAckReportLoss: boolean;
  employeeAckPolicy: boolean;
  employeeSignatureName: string | null;
  employeeSignatureAt: string | null;
  returnedAt: string | null;
  receivedBy: string | null;
  receiverDisplayName: string | null;
  receiverTitle: string | null;
  returnConditionNotes: string | null;
  returnAckReturned: boolean | null;
  returnAckMaintained: boolean | null;
  returnAckLiability: boolean | null;
  employeeReturnSignatureName: string | null;
  employeeReturnSignatureAt: string | null;
}

export interface MhdCreatePropertyItemInput {
  companyId: string;
  category: MhdPropertyCategory;
  name: string;
  description?: string | null;
  serialNumber?: string | null;
  quantityTotal?: number;
  unitCost?: number | null;
  acquisitionDate?: string | null;
}

export interface MhdUpdatePropertyItemInput {
  name: string;
  description?: string | null;
  status: MhdPropertyItemStatus;
  conditionNotes?: string | null;
}

export interface MhdIssuePropertyInput {
  propertyItemId: MhdPropertyItemId;
  personId: string;
  quantity: number;
  issuerTitle?: string | null;
  issuanceConditionNotes?: string | null;
  employeeAckReceipt: boolean;
  employeeAckMaintain: boolean;
  employeeAckReportLoss: boolean;
  employeeAckPolicy: boolean;
  employeeSignatureName: string;
}

export interface MhdReturnPropertyInput {
  receiverTitle?: string | null;
  returnConditionNotes?: string | null;
  returnAckReturned: boolean;
  returnAckMaintained: boolean;
  returnAckLiability: boolean;
  employeeReturnSignatureName: string;
}

export interface MhdPropertyPersonOption {
  id: string;
  displayName: string;
}

export interface MhdPropertyListFilters {
  searchTerm: string;
  category: MhdPropertyCategory | 'ALL';
  status: MhdPropertyItemStatus | 'ALL';
}

export type MhdRpcPropertyItemRow = DbFunctions['mhd_list_property_items']['Returns'][number];
export type MhdRpcPropertyAssignmentRow =
  DbFunctions['mhd_list_property_assignments']['Returns'][number];

export const MHD_PROPERTY_CATEGORIES = [
  'EQUIPMENT',
  'ELECTRONICS',
  'VEHICLE',
  'KEY',
  'UNIFORM',
  'TOOL',
  'OTHER',
] as const satisfies readonly MhdPropertyCategory[];

export const MHD_PROPERTY_ITEM_STATUSES = [
  'IN_STOCK',
  'ASSIGNED',
  'RETIRED',
  'LOST',
  'DAMAGED',
] as const satisfies readonly MhdPropertyItemStatus[];

export const MHD_PROPERTY_ASSIGNMENT_STATUSES = [
  'ISSUED',
  'RETURNED',
  'LOST',
  'DAMAGED',
] as const satisfies readonly MhdPropertyAssignmentStatus[];

export function mhdIsPropertyIssuanceComplete(input: {
  employeeAckReceipt: boolean;
  employeeAckMaintain: boolean;
  employeeAckReportLoss: boolean;
  employeeAckPolicy: boolean;
  employeeSignatureName: string | null | undefined;
}): boolean {
  return (
    input.employeeAckReceipt &&
    input.employeeAckMaintain &&
    input.employeeAckReportLoss &&
    input.employeeAckPolicy &&
    !!input.employeeSignatureName &&
    input.employeeSignatureName.trim().length > 0
  );
}

export function mhdIsPropertyReturnComplete(input: {
  returnAckReturned: boolean;
  returnAckMaintained: boolean;
  returnAckLiability: boolean;
  employeeReturnSignatureName: string | null | undefined;
}): boolean {
  return (
    input.returnAckReturned &&
    input.returnAckMaintained &&
    input.returnAckLiability &&
    !!input.employeeReturnSignatureName &&
    input.employeeReturnSignatureName.trim().length > 0
  );
}

export function mhdFormatPropertyItemStatus(status: MhdPropertyItemStatus): string {
  const labels: Record<MhdPropertyItemStatus, string> = {
    IN_STOCK: 'In Stock',
    ASSIGNED: 'Assigned',
    RETIRED: 'Retired',
    LOST: 'Lost',
    DAMAGED: 'Damaged',
  };

  return labels[status];
}

export function mhdFormatPropertyAssignmentStatus(status: MhdPropertyAssignmentStatus): string {
  const labels: Record<MhdPropertyAssignmentStatus, string> = {
    ISSUED: 'Issued',
    RETURNED: 'Returned',
    LOST: 'Lost',
    DAMAGED: 'Damaged',
  };

  return labels[status];
}
