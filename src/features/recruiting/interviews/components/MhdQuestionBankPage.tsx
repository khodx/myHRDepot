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
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900">Interview question bank</h1>
        <p className="mt-1 text-sm text-neutral-600">
          A categorized library of interview questions. STANDARD questions are asked of every
          applicant; JOB questions are pulled onto a guide when they match the role&apos;s
          competencies. Each carries a compliance flag.
        </p>
      </header>

      {/* Author form (privileged only) */}
      {canManage ? (
        <section className="rounded-lg border border-neutral-200 p-4">
          <h2 className="text-base font-semibold text-neutral-900">Add a question</h2>
          <form onSubmit={handleSubmit(handleCreate)} className="mt-4 space-y-4">
            <input type="hidden" value={companyId} {...register('companyId')} readOnly />

            <div>
              <label htmlFor="questionText" className="block text-sm font-medium text-neutral-700">
                Question
              </label>
              <textarea
                id="questionText"
                rows={2}
                {...register('questionText')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              {errors.questionText ? (
                <p className="mt-1 text-xs text-rose-600">{errors.questionText.message}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-neutral-700">
                  Category
                </label>
                <select
                  id="categoryId"
                  {...register('categoryId')}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
                <label htmlFor="questionKey" className="block text-sm font-medium text-neutral-700">
                  Question key
                </label>
                <input
                  id="questionKey"
                  type="text"
                  {...register('questionKey')}
                  placeholder="e.g. CONFLICT_RESOLUTION"
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
                {errors.questionKey ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.questionKey.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="scope" className="block text-sm font-medium text-neutral-700">
                  Scope
                </label>
                <select
                  id="scope"
                  {...register('scope')}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                >
                  {MHD_INTERVIEW_QUESTION_SCOPES.map((scope) => (
                    <option key={scope} value={scope}>
                      {mhdFormatQuestionScope(scope)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="responseType" className="block text-sm font-medium text-neutral-700">
                  Response type
                </label>
                <select
                  id="responseType"
                  {...register('responseType')}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                >
                  {MHD_INTERVIEW_RESPONSE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {mhdFormatResponseType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="competencyId" className="block text-sm font-medium text-neutral-700">
                  Competency{' '}
                  <span className="font-normal text-neutral-500">(for JOB scope)</span>
                </label>
                <select
                  id="competencyId"
                  {...register('competencyId')}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {competencies.map((competency) => (
                    <option key={competency.id} value={competency.id}>
                      {competency.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="guidance" className="block text-sm font-medium text-neutral-700">
                Interviewer guidance{' '}
                <span className="font-normal text-neutral-500">(optional)</span>
              </label>
              <textarea
                id="guidance"
                rows={2}
                {...register('guidance')}
                placeholder="What a strong answer looks like."
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="complianceStatus"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Compliance status
                </label>
                <select
                  id="complianceStatus"
                  {...register('complianceStatus')}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
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
                  className="block text-sm font-medium text-neutral-700"
                >
                  Compliance guidance{' '}
                  <span className="font-normal text-neutral-500">(optional)</span>
                </label>
                <input
                  id="complianceGuidance"
                  type="text"
                  {...register('complianceGuidance')}
                  placeholder="Why to avoid / how to ask legally."
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createQuestion.isPending}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {createQuestion.isPending ? 'Adding…' : 'Add question'}
              </button>
            </div>
            {createQuestion.isError ? (
              <p className="text-xs text-rose-600">
                {createQuestion.error instanceof Error
                  ? createQuestion.error.message
                  : 'Unable to add the question.'}
              </p>
            ) : null}
          </form>
        </section>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="filterCategory" className="block text-xs font-medium text-neutral-600">
            Category
          </label>
          <select
            id="filterCategory"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="ALL">All categories</option>
            {(categories.data ?? []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.categoryName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filterScope" className="block text-xs font-medium text-neutral-600">
            Scope
          </label>
          <select
            id="filterScope"
            value={scopeFilter}
            onChange={(event) =>
              setScopeFilter(event.target.value as MhdInterviewQuestionScope | 'ALL')
            }
            className="mt-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          >
            <option value="ALL">All scopes</option>
            {MHD_INTERVIEW_QUESTION_SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {mhdFormatQuestionScope(scope)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* The bank */}
      {questions.isLoading ? (
        <p className="text-sm text-neutral-500">Loading questions…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-neutral-500">No questions match this filter.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map(([categoryName, items]) => (
            <section key={categoryName} className="space-y-3">
              <h2 className="text-base font-semibold text-neutral-900">{categoryName}</h2>
              <ul className="space-y-3">
                {items.map((question) => (
                  <li
                    key={question.id}
                    className="rounded-md border border-neutral-200 bg-white p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-neutral-900">{question.questionText}</p>
                      <MhdComplianceFlag
                        status={question.complianceStatus}
                        guidance={question.complianceGuidance}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
                      <span className="rounded bg-neutral-100 px-2 py-0.5">
                        {mhdFormatQuestionScope(question.scope)}
                      </span>
                      <span className="rounded bg-neutral-100 px-2 py-0.5">
                        {mhdFormatResponseType(question.responseType)}
                      </span>
                      {question.isGlobal ? (
                        <span className="rounded bg-sky-100 px-2 py-0.5 text-sky-700">Global</span>
                      ) : null}
                    </div>
                    {question.guidance ? (
                      <p className="mt-2 text-xs text-neutral-500">{question.guidance}</p>
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
