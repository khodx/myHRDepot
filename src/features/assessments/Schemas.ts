import { z } from 'zod';
import {
  MHD_ASSESSMENT_ASSEMBLY_MODES,
  MHD_ASSESSMENT_DIFFICULTIES,
  MHD_ASSESSMENT_INTEGRITY_PROFILES,
  MHD_ASSESSMENT_QUESTION_TYPES,
} from './Types';

const uuid = z.string().uuid();
export const mhdAssessmentQuestionTypeSchema = z.enum(MHD_ASSESSMENT_QUESTION_TYPES);
export const mhdAssessmentAssemblyModeSchema = z.enum(MHD_ASSESSMENT_ASSEMBLY_MODES);
export const mhdAssessmentIntegrityProfileSchema = z.enum(MHD_ASSESSMENT_INTEGRITY_PROFILES);
export const mhdAssessmentDifficultySchema = z.enum(MHD_ASSESSMENT_DIFFICULTIES);
export const mhdAssessmentItemCreateSchema = z.object({
  companyId: uuid,
  questionType: mhdAssessmentQuestionTypeSchema,
  prompt: z.string().trim().min(1),
  options: z.unknown().optional().default([]),
  correctAnswer: z.unknown().nullable().optional().default(null),
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  difficulty: mhdAssessmentDifficultySchema.nullable().optional().default(null),
  competencyId: uuid.nullable().optional().default(null),
});
export const mhdAssessmentCreateSchema = z.object({
  companyId: uuid,
  title: z.string().trim().min(1),
  assemblyMode: mhdAssessmentAssemblyModeSchema.default('FIXED'),
  courseId: uuid.nullable().optional().default(null),
  integrityProfile: mhdAssessmentIntegrityProfileSchema.default('LIGHT'),
  timeLimitMinutes: z.number().int().positive().nullable().optional().default(null),
  itemIds: z.array(uuid).optional().default([]),
});
export const mhdAccommodationRequestCreateSchema = z.object({
  companyId: uuid,
  assessmentId: uuid,
  personId: uuid,
  extendedTimePercent: z.number().int().nonnegative().nullable().optional().default(null),
  attemptCountOverride: z.number().int().positive().nullable().optional().default(null),
  integrityProfileOverride: mhdAssessmentIntegrityProfileSchema.nullable().optional().default(null),
});
export const mhdAccommodationRequestDecideSchema = z.object({
  requestId: uuid,
  approve: z.boolean(),
  notes: z.string().nullable().optional().default(null),
});
export const mhdAssessmentAttemptSubmitSchema = z.object({
  attemptId: uuid,
  responses: z.record(z.string(), z.unknown()),
});
export const mhdAssessmentAttemptGradeSchema = z.object({
  attemptId: uuid,
  scorePercent: z.number().min(0).max(100),
  passed: z.boolean(),
});
export const mhdAssessmentItemListSchema = z.object({
  companyId: uuid,
  tag: z.string().trim().min(1).nullable().optional().default(null),
});
export const mhdAssessmentGetSchema = z.object({ assessmentId: uuid });
export const mhdAssessmentAttemptStartSchema = z.object({
  assessmentId: uuid,
  assignmentId: uuid.nullable().optional().default(null),
});
export const mhdAssessmentAttemptListSchema = z.object({
  assessmentId: uuid,
  personId: uuid.nullable().optional().default(null),
});
