import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFormFieldStack } from '@/components/ui/MhdFormFieldStack';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  useMhdCreateInterviewQuestion,
  useMhdInterviewCategories,
  useMhdInterviewQuestions,
} from '../Hook';
import { mhdQuestionCreateSchema, type MhdQuestionCreateFormValues } from '../Schemas';
import {
  MHD_INTERVIEW_COMPLIANCE_STATUSES,
  MHD_INTERVIEW_QUESTION_SCOPES,
  MHD_INTERVIEW_RESPONSE_TYPES,
  mhdFormatComplianceStatus,
  mhdFormatQuestionScope,
  mhdFormatResponseType,
  type MhdInterviewQuestion,
  type MhdInterviewQuestionScope,
} from '../Types';
import { MhdComplianceFlag } from './MhdComplianceFlag';

interface CompetencyOption {
  id: string;
  name: string;
}

interface Props {
  companyId: string;
  /**
   * Whether the viewer may author questions (a privileged recruiter). The create
   * RPC re-checks regardless; this only governs whether the author form is shown.
   */
  canManage: boolean;
  /**
   * Competencies (from Job Descriptions `0033`) to tag a JOB question against —
   * the link that drives competency-matched assembly and the evaluation weighting.
   * Injected by the host route (this page does not fetch competencies). Optional.
   */
  competencies?: CompetencyOption[];
}

/**
 * `/recruiting/questions` — the interview question bank, by category.
 *
 * The library is a global pack plus the company's own questions, each carrying a
 * compliance flag (`compliance_status` + guidance) surfaced via `MhdComplianceFlag`.
 * Privileged recruiters author new questions (`question_create`); everyone with
 * company access can read the bank. Content itself is attorney/SME work — a new
 * question is born REVIEW until cleared.
 */
export function MhdQuestionBankPage({ companyId, canManage, competencies = [] }: Props) {
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [scopeFilter, setScopeFilter] = useState<MhdInterviewQuestionScope | 'ALL'>('ALL');

  const categories = useMhdInterviewCategories(companyId);
  const questions = useMhdInterviewQuestions({
    companyId,
    categoryId: categoryFilter === 'ALL' ? null : categoryFilter,
    scope: scopeFilter,
  });
  const createQuestion = useMhdCreateInterviewQuestion();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MhdQuestionCreateFormValues>({
    resolver: zodResolver(mhdQuestionCreateSchema),
    defaultValues: {
      companyId,
      categoryId: '',
      questionKey: '',
      questionText: '',
      scope: 'GENERAL',
      responseType: 'RATING_1_5',
      competencyId: '',
      guidance: '',
      complianceStatus: 'REVIEW',
      complianceGuidance: '',
    },
  });

  // Group the flat question list by category for the display below.
  const grouped = useMemo(() => {
    const map = new Map<string, MhdInterviewQuestion[]>();
    for (const question of questions.data ?? []) {
      const key = question.categoryName ?? 'Uncategorized';
      const bucket = map.get(key) ?? [];
      bucket.push(question);
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [questions.data]);

  async function handleCreate(values: MhdQuestionCreateFormValues) {
    await createQuestion.mutateAsync({
      companyId,
      categoryId: values.categoryId,
      questionKey: values.questionKey,
      questionText: values.questionText,
      scope: values.scope,
      responseType: values.responseType,
      competencyId: values.competencyId || null,
      guidance: values.guidance || null,
      complianceStatus: values.complianceStatus,
      complianceGuidance: values.complianceGuidance || null,
    });
    reset({
      companyId,
      categoryId: '',
      questionKey: '',
      questionText: '',
      scope: 'GENERAL',
      responseType: 'RATING_1_5',
      competencyId: '',
      guidance: '',
      complianceStatus: 'REVIEW',
      complianceGuidance: '',
    });
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Interview question bank"
        description="A categorized library of interview questions. STANDARD questions are asked of every applicant; JOB questions are pulled onto a guide when they match the role's competencies. Each carries a compliance flag."
      />

      {/* Author form (privileged only) */}
      {canManage ? (
        <MhdCard>
          <h2 className="text-base font-semibold text-foreground">Add a question</h2>
          <form onSubmit={handleSubmit(handleCreate)} className="mt-4 space-y-4">
            <input type="hidden" value={companyId} {...register('companyId')} readOnly />

            <div>
              <label htmlFor="questionText" className="block text-sm font-medium text-foreground">
                Question
              </label>
              <textarea
                id="questionText"
                rows={2}
                {...register('questionText')}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
              {errors.questionText ? (
                <p className="mt-1 text-xs text-rose-600">{errors.questionText.message}</p>
              ) : null}
            </div>

            <MhdFormFieldStack>
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-foreground">
                  Category
                </label>
                <select
                  id="categoryId"
                  {...register('categoryId')}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  <option value="">Choose a category…</option>
                  {(categories.data ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.categoryName}
                    </option>
                  ))}
                </select>
                {errors.categoryId ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.categoryId.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="questionKey" className="block text-sm font-medium text-foreground">
                  Question key
                </label>
                <input
                  id="questionKey"
                  type="text"
                  {...register('questionKey')}
                  placeholder="e.g. CONFLICT_RESOLUTION"
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
                {errors.questionKey ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.questionKey.message}</p>
                ) : null}
              </div>
            </MhdFormFieldStack>

            <MhdFormFieldStack>
              <div>
                <label htmlFor="scope" className="block text-sm font-medium text-foreground">
                  Scope
                </label>
                <select
                  id="scope"
                  {...register('scope')}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  {MHD_INTERVIEW_QUESTION_SCOPES.map((scope) => (
                    <option key={scope} value={scope}>
                      {mhdFormatQuestionScope(scope)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="responseType" className="block text-sm font-medium text-foreground">
                  Response type
                </label>
                <select
                  id="responseType"
                  {...register('responseType')}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  {MHD_INTERVIEW_RESPONSE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {mhdFormatResponseType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="competencyId" className="block text-sm font-medium text-foreground">
                  Competency{' '}
                  <span className="font-normal text-muted-foreground">(for JOB scope)</span>
                </label>
                <select
                  id="competencyId"
                  {...register('competencyId')}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {competencies.map((competency) => (
                    <option key={competency.id} value={competency.id}>
                      {competency.name}
                    </option>
                  ))}
                </select>
              </div>
            </MhdFormFieldStack>

            <div>
              <label htmlFor="guidance" className="block text-sm font-medium text-foreground">
                Interviewer guidance{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="guidance"
                rows={2}
                {...register('guidance')}
                placeholder="What a strong answer looks like."
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </div>

            <MhdFormFieldStack>
              <div>
                <label
                  htmlFor="complianceStatus"
                  className="block text-sm font-medium text-foreground"
                >
                  Compliance status
                </label>
                <select
                  id="complianceStatus"
                  {...register('complianceStatus')}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  {MHD_INTERVIEW_COMPLIANCE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {mhdFormatComplianceStatus(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="complianceGuidance"
                  className="block text-sm font-medium text-foreground"
                >
                  Compliance guidance{' '}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="complianceGuidance"
                  type="text"
                  {...register('complianceGuidance')}
                  placeholder="Why to avoid / how to ask legally."
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm"
                />
              </div>
            </MhdFormFieldStack>

            <div className="flex justify-end">
              <Button type="submit" disabled={createQuestion.isPending}>
                {createQuestion.isPending ? 'Adding…' : 'Add question'}
              </Button>
            </div>
            {createQuestion.isError ? (
              <p className="text-xs text-rose-600">
                {createQuestion.error instanceof Error
                  ? createQuestion.error.message
                  : 'Unable to add the question.'}
              </p>
            ) : null}
          </form>
        </MhdCard>
      ) : null}

      {/* Filters */}
      <MhdCard className="grid gap-3 md:grid-cols-3">
        <MhdFilterSelect
          label="Category"
          id="filterCategory"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="ALL">All categories</option>
          {(categories.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.categoryName}
            </option>
          ))}
        </MhdFilterSelect>

        <MhdFilterSelect
          label="Scope"
          id="filterScope"
          value={scopeFilter}
          onChange={(event) =>
            setScopeFilter(event.target.value as MhdInterviewQuestionScope | 'ALL')
          }
        >
          <option value="ALL">All scopes</option>
          {MHD_INTERVIEW_QUESTION_SCOPES.map((scope) => (
            <option key={scope} value={scope}>
              {mhdFormatQuestionScope(scope)}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdCard>

      {/* The bank */}
      {questions.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading questions…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions match this filter.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(([categoryName, items]) => (
            <section key={categoryName} className="space-y-3">
              <h2 className="text-base font-semibold text-foreground">{categoryName}</h2>
              <ul className="space-y-3">
                {items.map((question) => (
                  <li key={question.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-foreground">{question.questionText}</p>
                      <MhdComplianceFlag
                        status={question.complianceStatus}
                        guidance={question.complianceGuidance}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-0.5">
                        {mhdFormatQuestionScope(question.scope)}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5">
                        {mhdFormatResponseType(question.responseType)}
                      </span>
                      {question.isGlobal ? <MhdBadge variant="info">Global</MhdBadge> : null}
                    </div>
                    {question.guidance ? (
                      <p className="mt-2 text-xs text-muted-foreground">{question.guidance}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
