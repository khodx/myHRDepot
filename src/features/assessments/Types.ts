export const MHD_ASSESSMENT_QUESTION_TYPES = [
  'MCQ_SINGLE',
  'MCQ_MULTI',
  'TRUE_FALSE',
  'MATCHING',
  'ORDERING',
  'FILL_IN_BLANK',
  'NUMERIC_TOLERANCE',
  'SHORT_TEXT',
  'LONG_TEXT_RUBRIC',
  'FILE_UPLOAD',
  'HOTSPOT',
  'DRAG_INTO_CATEGORY',
  'LIKERT',
  'RANKING',
  'SCENARIO_RESPONSE',
] as const satisfies readonly string[];

export const MHD_ASSESSMENT_ASSEMBLY_MODES = [
  'FIXED',
  'RANDOM',
] as const satisfies readonly string[];
export const MHD_ASSESSMENT_INTEGRITY_PROFILES = [
  'NONE',
  'LIGHT',
  'STRICT',
] as const satisfies readonly string[];
export const MHD_ASSESSMENT_DIFFICULTIES = [
  'EASY',
  'MEDIUM',
  'HARD',
] as const satisfies readonly string[];
export const MHD_ASSESSMENT_ATTEMPT_STATUSES = [
  'IN_PROGRESS',
  'SUBMITTED',
  'PENDING_REVIEW',
  'GRADED',
] as const satisfies readonly string[];
export const MHD_ACCOMMODATION_REQUEST_STATUSES = [
  'PENDING',
  'APPROVED',
  'DENIED',
] as const satisfies readonly string[];

export type MhdAssessmentQuestionType = (typeof MHD_ASSESSMENT_QUESTION_TYPES)[number];
export type MhdAssessmentAssemblyMode = (typeof MHD_ASSESSMENT_ASSEMBLY_MODES)[number];
export type MhdAssessmentIntegrityProfile = (typeof MHD_ASSESSMENT_INTEGRITY_PROFILES)[number];
export type MhdAssessmentDifficulty = (typeof MHD_ASSESSMENT_DIFFICULTIES)[number];
export type MhdAssessmentAttemptStatus = (typeof MHD_ASSESSMENT_ATTEMPT_STATUSES)[number];
export type MhdAccommodationRequestStatus = (typeof MHD_ACCOMMODATION_REQUEST_STATUSES)[number];
export type MhdAssessmentItemReferenceId = `AIT-${string}`;
export type MhdAssessmentReferenceId = `ASM-${string}`;
export type MhdAssessmentAttemptReferenceId = `ATT-${string}`;
export type MhdAccommodationRequestReferenceId = `TAR-${string}`;

export interface MhdAssessmentItemRpcRow {
  id: string;
  reference_id: string;
  question_type: MhdAssessmentQuestionType;
  prompt: string;
  options: unknown;
  requires_manual_grading: boolean;
  tags: string[];
  difficulty: MhdAssessmentDifficulty | null;
  competency_id: string | null;
  is_active: boolean;
}
export interface MhdAssessmentCreateRpcRow {
  id: string;
  reference_id: string;
}
export interface MhdAssessmentGetRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  course_id: string | null;
  title: string;
  assembly_mode: MhdAssessmentAssemblyMode;
  integrity_profile: MhdAssessmentIntegrityProfile;
  time_limit_minutes: number | null;
  item_id: string | null;
  question_type: MhdAssessmentQuestionType | null;
  prompt: string | null;
  options: unknown;
  sort_order: number | null;
}
export interface MhdAccommodationRequestRpcRow {
  id: string;
  reference_id: string;
}
export interface MhdAssessmentAttemptStartRpcRow {
  id: string;
  reference_id: string;
  attempt_number: number;
}
export interface MhdAssessmentAttemptSubmitRpcRow {
  status: MhdAssessmentAttemptStatus;
  score_percent: number | null;
  passed: boolean | null;
}
export interface MhdAssessmentAttemptRpcRow {
  id: string;
  reference_id: string;
  person_id: string;
  attempt_number: number;
  status: MhdAssessmentAttemptStatus;
  score_percent: number | null;
  passed: boolean | null;
  started_at: string;
  submitted_at: string | null;
}

export interface MhdAssessmentItem {
  id: string;
  referenceId: MhdAssessmentItemReferenceId;
  questionType: MhdAssessmentQuestionType;
  prompt: string;
  options: unknown;
  requiresManualGrading: boolean;
  tags: string[];
  difficulty: MhdAssessmentDifficulty | null;
  competencyId: string | null;
  isActive: boolean;
}
export interface MhdAssessmentItemCreateInput {
  companyId: string;
  questionType: MhdAssessmentQuestionType;
  prompt: string;
  options?: unknown;
  correctAnswer?: unknown;
  tags?: string[];
  difficulty?: MhdAssessmentDifficulty | null;
  competencyId?: string | null;
}
export interface MhdAssessment {
  id: string;
  referenceId: MhdAssessmentReferenceId;
  companyId: string;
  courseId: string | null;
  title: string;
  assemblyMode: MhdAssessmentAssemblyMode;
  integrityProfile: MhdAssessmentIntegrityProfile;
  timeLimitMinutes: number | null;
  items: MhdAssessmentItemSummary[];
}
export interface MhdAssessmentItemSummary {
  itemId: string;
  questionType: MhdAssessmentQuestionType;
  prompt: string;
  options: unknown;
  sortOrder: number;
}
export interface MhdAssessmentCreateInput {
  companyId: string;
  title: string;
  assemblyMode?: MhdAssessmentAssemblyMode;
  courseId?: string | null;
  integrityProfile?: MhdAssessmentIntegrityProfile;
  timeLimitMinutes?: number | null;
  itemIds?: string[];
}
export interface MhdAccommodationRequestCreateInput {
  companyId: string;
  assessmentId: string;
  personId: string;
  extendedTimePercent?: number | null;
  attemptCountOverride?: number | null;
  integrityProfileOverride?: MhdAssessmentIntegrityProfile | null;
}
export interface MhdAssessmentAttempt {
  id: string;
  referenceId: MhdAssessmentAttemptReferenceId;
  personId: string;
  attemptNumber: number;
  status: MhdAssessmentAttemptStatus;
  scorePercent: number | null;
  passed: boolean | null;
  startedAt: string;
  submittedAt: string | null;
}
export interface MhdAssessmentAttemptSubmitInput {
  attemptId: string;
  responses: Record<string, unknown>;
}
export interface MhdAssessmentAttemptSubmitResult {
  status: MhdAssessmentAttemptStatus;
  scorePercent: number | null;
  passed: boolean | null;
}

export interface MhdMutationResult {
  id: string;
  referenceId: string;
}

export const mhdFormatAssessmentQuestionType = (v: MhdAssessmentQuestionType) =>
  v
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const mhdFormatAssessmentAssemblyMode = (v: MhdAssessmentAssemblyMode) =>
  v === 'FIXED' ? 'Fixed' : 'Random';
export const mhdFormatAssessmentIntegrityProfile = (v: MhdAssessmentIntegrityProfile) =>
  v[0] + v.slice(1).toLowerCase();
export const mhdFormatAssessmentDifficulty = (v: MhdAssessmentDifficulty) =>
  v[0] + v.slice(1).toLowerCase();
export const mhdFormatAssessmentAttemptStatus = (v: MhdAssessmentAttemptStatus) =>
  v
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const mhdFormatAccommodationRequestStatus = (v: MhdAccommodationRequestStatus) =>
  v[0] + v.slice(1).toLowerCase();
