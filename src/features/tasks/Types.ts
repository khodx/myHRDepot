import type { MhdCompanyId } from '@/features/companies/Types';

// All *Id types below are Postgres `uuid`, not ULIDs. TypeScript still
// models them as `string` (uuid renders as a string over the wire);
// reference_id remains a separate branded `text` type.
export type MhdTaskId = string;
export type MhdTaskReferenceId = `TASK-${string}`;
export type MhdTaskStatusId = string;
export type MhdTaskPriorityId = string;
export type MhdUserId = string;

// `description_rich_text jsonb` and `calculated_progress_percent integer`
// are columns on `public.tasks`, returned by
// `mhd_get_task_by_id`/`mhd_list_task_board`. `overall_progress_percent`
// (MAX(manual, calculated)) is a V2 idea, not a live column; do not add it
// back without a real `alter table` first.
//
// `descriptionRichText` holds an opaque structured document (e.g. a
// TipTap/ProseMirror JSON doc) — typed `unknown` here rather than a specific
// editor's node-tree shape, since the editor library isn't pinned yet.
// `descriptionPlainText` remains the fallback/searchable/notification-preview
// representation and is not derived from the rich-text value automatically.
//
// `calculatedProgressPercent` is `null` when the task has zero subtasks
// ("no subtasks" is a distinct state from "0% through some subtasks").
// Frontend code must fall back to `manualProgressPercent` when it is null —
// it is never written directly by mhd_create_task/mhd_update_task, only by
// the mhd_trg_recalculate_task_progress trigger on public.subtasks.
export interface MhdTask {
  id: MhdTaskId;
  referenceId: MhdTaskReferenceId;
  companyId: MhdCompanyId;
  companyName: string;
  title: string;
  descriptionPlainText: string | null;
  descriptionRichText: unknown | null;
  statusId: MhdTaskStatusId;
  statusName: string;
  statusColorToken: string | null;
  priorityId: MhdTaskPriorityId | null;
  priorityName: string | null;
  priorityColorToken: string | null;
  startDate: string | null;
  dueDate: string | null;
  completedDate: string | null;
  manualProgressPercent: number;
  calculatedProgressPercent: number | null;
  assignedUserIds: MhdUserId[];
  assignedDisplayNames: string[];
  noteCount: number;
  attachmentCount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

// public.statuses/public.priorities have no `reference_id` column (and
// statuses has no `entity_type` — it is a flat, shared lookup, not scoped
// per entity type). There are no branded reference_id fields and no
// TASK-only filtering on these option types.
export interface MhdTaskStatusOption {
  id: MhdTaskStatusId;
  statusName: string;
  category: string;
  displayOrder: number;
  colorToken: string | null;
}

export interface MhdTaskPriorityOption {
  id: MhdTaskPriorityId;
  priorityName: string;
  displayOrder: number;
  colorToken: string | null;
}

export interface MhdTaskAssignableUser {
  id: MhdUserId;
  personId: string;
  companyId: MhdCompanyId;
  displayName: string;
  email: string;
}

export interface MhdTaskListFilters {
  companyId: MhdCompanyId | 'ALL';
  statusId: MhdTaskStatusId | 'ALL';
  priorityId: MhdTaskPriorityId | 'ALL';
  assignedUserId: MhdUserId | 'ALL';
  searchTerm: string;
  dueFrom: string;
  dueTo: string;
}

export interface MhdCreateTaskInput {
  companyId: MhdCompanyId;
  title: string;
  descriptionPlainText: string;
  descriptionRichText?: unknown | null;
  statusId: MhdTaskStatusId;
  priorityId: MhdTaskPriorityId | '';
  startDate: string;
  dueDate: string;
  manualProgressPercent: number;
  assignedUserIds: MhdUserId[];
}

export interface MhdUpdateTaskInput extends MhdCreateTaskInput {
  taskId: MhdTaskId;
  completedDate: string;
}

export interface MhdTaskMutationContext {
  actorUserId: string;
}

// public.subtasks is the full TBL-011 locked spec below; there is no
// `completed boolean` column — "done" is derived from `statusId` joining
// to `statuses.category = 'COMPLETED'` (same 6 shared status rows tasks
// use), matching the tasks module's own status pattern. `SUBT-` prefix via
// `trg_subtasks_reference_id`.
//
// `calculatedProgressPercent` is reserved for future nested-subtask
// recursion (locked spec note) — mhd_create_subtask/mhd_update_subtask
// mirror it to manualProgressPercent; no recursive calculation is
// implemented. `overallProgressPercent` is the displayed value and, for
// the same reason, also mirrors manualProgressPercent.
//
// The parent task's `calculatedProgressPercent` (see MhdTask above) is
// auto-derived by `mhd_trg_recalculate_task_progress`, keyed off
// `subtasks.status_id` -> `statuses.category = 'COMPLETED'`.
export type MhdSubtaskId = string;
export type MhdSubtaskReferenceId = `SUBT-${string}`;

export interface MhdSubtask {
  id: MhdSubtaskId;
  referenceId: MhdSubtaskReferenceId;
  taskId: MhdTaskId;
  title: string;
  descriptionPlainText: string | null;
  descriptionRichText: unknown | null;
  statusId: MhdTaskStatusId;
  statusName: string;
  statusColorToken: string | null;
  statusCategory: string;
  priorityId: MhdTaskPriorityId | null;
  priorityName: string | null;
  priorityColorToken: string | null;
  dueDate: string | null;
  manualProgressPercent: number;
  calculatedProgressPercent: number;
  overallProgressPercent: number;
  sortOrder: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface MhdCreateSubtaskInput {
  taskId: MhdTaskId;
  title: string;
  descriptionPlainText?: string | null;
  descriptionRichText?: unknown | null;
  statusId?: MhdTaskStatusId | '';
  priorityId?: MhdTaskPriorityId | '';
  dueDate?: string;
  manualProgressPercent: number;
  sortOrder?: number;
}

export interface MhdUpdateSubtaskInput extends MhdCreateSubtaskInput {
  subtaskId: MhdSubtaskId;
}
