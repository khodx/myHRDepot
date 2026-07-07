// Database row types
export interface MhdCompanyRow {
  id: string;
  reference_id: string;
  company_name: string;
  industry?: string;
  employee_count?: number;
  headquarters_location?: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface MhdRoleRow {
  id: string;
  company_id: string;
  role_name: string;
  description?: string;
  created_at: string;
}

export interface MhdPersonRow {
  id: string;
  reference_id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  display_name: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface MhdUserRow {
  id: string;
  email: string;
  company_id: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface MhdStatusRow {
  id: string;
  status_name: string;
  category: string;
  color_token?: string;
  display_order: number;
}

export interface MhdPriorityRow {
  id: string;
  priority_name: string;
  color_token?: string;
  display_order: number;
}

export interface MhdTaskRow {
  id: string;
  reference_id: string;
  company_id: string;
  title: string;
  description_plain_text?: string;
  status_id: string;
  priority_id?: string;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  manual_progress_percent: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface MhdSubtaskRow {
  id: string;
  reference_id: string;
  task_id: string;
  title: string;
  completed: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface MhdTaskAssignmentRow {
  id: string;
  task_id: string;
  user_id: string;
  assignment_type: 'PRIMARY' | 'OBSERVER' | 'REVIEWER';
  created_at: string;
  created_by: string;
}

export interface MhdNoteRow {
  id: string;
  reference_id: string;
  company_id: string;
  task_id: string;
  note_text: string;
  is_internal: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface MhdAttachmentRow {
  id: string;
  reference_id: string;
  company_id: string;
  task_id?: string;
  file_name: string;
  file_size_bytes: bigint;
  mime_type: string;
  storage_path: string;
  is_deleted: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface MhdAuditEventRow {
  id: string;
  company_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  changes?: Record<string, any>;
  actor_id: string;
  created_at: string;
}

export interface MhdWorkflowTransitionRow {
  id: string;
  company_id: string;
  task_id: string;
  from_status_id: string;
  to_status_id: string;
  reason?: string;
  created_by: string;
  created_at: string;
}

export interface MhdApprovalRow {
  id: string;
  reference_id: string;
  company_id: string;
  task_id: string;
  entity_type: string;
  entity_id: string;
  approval_type: 'APPROVAL_REQUIRED' | 'APPROVAL_FOR_INFO';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  requester_id: string;
  current_level: number;
  total_levels: number;
  reason?: string;
  created_at: string;
  created_by: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface MhdFormRow {
  id: string;
  reference_id: string;
  company_id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  definition: Record<string, any>;
  version: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

export interface MhdFormSubmissionRow {
  id: string;
  reference_id: string;
  form_id: string;
  company_id: string;
  submitter_id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  submitted_at?: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

// Domain models (camelCase, application layer)
export interface Company {
  id: string;
  referenceId: string;
  name: string;
  industry?: string;
  employeeCount?: number;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  referenceId: string;
  companyId: string;
  title: string;
  description?: string;
  statusId: string;
  statusName: string;
  priorityId?: string;
  priorityName?: string;
  startDate?: string;
  dueDate?: string;
  completedDate?: string;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  referenceId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  companyId: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface WorkflowTransition {
  id: string;
  taskId: string;
  fromStatusName: string;
  toStatusName: string;
  reason?: string;
  createdByName: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  referenceId: string;
  taskId: string;
  approvalType: 'APPROVAL_REQUIRED' | 'APPROVAL_FOR_INFO';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  createdAt: string;
}

export interface Note {
  id: string;
  referenceId: string;
  taskId: string;
  text: string;
  isInternal: boolean;
  createdByName: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  referenceId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  createdAt: string;
}
