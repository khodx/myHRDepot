export type MhdCommandCenterEntityType =
  | 'TASK'
  | 'ACTIVITY'
  | 'LEAVE_CASE'
  | 'ACCOMMODATION_CASE'
  | 'ATTENDANCE_EVENT'
  | 'CONDUCT_CASE'
  | 'INVESTIGATION'
  | 'TRAINING_ASSIGNMENT'
  | 'HANDBOOK_ACKNOWLEDGMENT'
  | 'ESIGNATURE_REQUEST'
  | 'APPROVAL';

export type MhdCommandCenterStatusCategory =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'PENDING_REVIEW'
  | 'COMPLETE'
  | 'CANCELLED'
  | 'WITHDRAWN';

export type MhdCommandCenterScope = 'mine' | 'downline' | 'company';

export interface MhdCommandCenterItem {
  itemId: string;
  entityType: string;
  entityId: string;
  referenceId: string | null;
  title: string;
  statusRaw: string | null;
  statusCategory: string;
  isAlert: boolean;
  personId: string | null;
  personName: string | null;
  companyId: string;
  primaryDate: string | null;
  linkPath: string | null;
  isSensitiveCategoryOnly: boolean;
}

export interface MhdCommandCenterFilters {
  entityTypes?: MhdCommandCenterEntityType[];
  statusCategories?: MhdCommandCenterStatusCategory[];
  alertOnly?: boolean;
  dateFrom?: string;
  dateTo?: string;
  searchText?: string;
  scope?: MhdCommandCenterScope;
  limit?: number;
  offset?: number;
  companyId?: string;
}

export const MHD_CC_ENTITY_TYPES: { value: MhdCommandCenterEntityType; label: string }[] = [
  { value: 'TASK', label: 'Task' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'LEAVE_CASE', label: 'Leave Case' },
  { value: 'ACCOMMODATION_CASE', label: 'Accommodation Case' },
  { value: 'ATTENDANCE_EVENT', label: 'Attendance' },
  { value: 'CONDUCT_CASE', label: 'Conduct Case' },
  { value: 'INVESTIGATION', label: 'Investigation' },
  { value: 'TRAINING_ASSIGNMENT', label: 'Training' },
  { value: 'HANDBOOK_ACKNOWLEDGMENT', label: 'Handbook Acknowledgment' },
  { value: 'ESIGNATURE_REQUEST', label: 'E-Signature' },
  { value: 'APPROVAL', label: 'Approval' },
];

export const MHD_CC_STATUS_CATEGORIES: {
  value: MhdCommandCenterStatusCategory;
  label: string;
}[] = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'COMPLETE', label: 'Complete' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'WITHDRAWN', label: 'Withdrawn' },
];

export function mhdFormatStatusCategory(category: MhdCommandCenterStatusCategory): string {
  return MHD_CC_STATUS_CATEGORIES.find((option) => option.value === category)?.label ?? category;
}

export const MHD_CC_ENTITY_LINK_BUILDERS: Partial<
  Record<MhdCommandCenterEntityType, (entityId: string, item: MhdCommandCenterItem) => string | null>
> = {
  TASK: (entityId) => `/tasks/${entityId}`,
  ACTIVITY: (entityId) => `/activities/${entityId}`,
  CONDUCT_CASE: (entityId) => `/conduct/${entityId}`,
  INVESTIGATION: (entityId) => `/investigations/${entityId}`,
  ESIGNATURE_REQUEST: (entityId) => `/esignature/${entityId}`,
  APPROVAL: (entityId) => `/approvals/${entityId}`,
  TRAINING_ASSIGNMENT: () => '/training',
  HANDBOOK_ACKNOWLEDGMENT: () => null,
  LEAVE_CASE: (entityId) => `/leaves/${entityId}`,
  ACCOMMODATION_CASE: (entityId) => `/accommodations/${entityId}`,
  ATTENDANCE_EVENT: () => null,
};
