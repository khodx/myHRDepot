import { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  useMhdAddCustomQuestion,
  useMhdAddGuideQuestion,
  useMhdAssembleGuide,
  useMhdGuideGetOrCreate,
  useMhdInterviewCategories,
  useMhdInterviewGuideItems,
  useMhdInterviewQuestions,
  useMhdRemoveGuideItem,
} from '../Hook';
import {
  mhdAddCustomQuestionSchema,
  type MhdAddCustomQuestionFormValues,
} from '../Schemas';
import {
  MHD_INTERVIEW_GUIDE_ITEM_SOURCES,
  MHD_INTERVIEW_RESPONSE_TYPES,
  mhdFormatGuideItemSource,
  mhdFormatResponseType,
  type MhdInterviewGuideItem,
  type MhdInterviewGuideItemSource,
} from '../Types';
import { MhdComplianceFlag } from './MhdComplianceFlag';

interface Props {
  companyId: string;
  requisitionId: string;
  /** Whether the viewer may build the guide (privileged). The RPCs re-check regardless. */
  canManage: boolean;
}

/**
 * The interview guide builder — the wizard's heart.
 *
 * Flow: `guide_get_or_create(requisitionId)` yields the requisition's single guide
 * (fired once on mount); `guide_assemble` pulls in the STANDARD pack plus every
 * JOB-competency-matched question (idempotent, re-runnable as the JD evolves);
 * `guide_list_items` renders the result GROUPED BY `source`. Each item shows its
 * compliance flag (CAUTION red with guidance, REVIEW amber, APPROVED neutral). A
 * recruiter tops it up with add-from-bank (`guide_add_question`) and add-custom
 * (`guide_add_custom`, optionally saving back to the bank).
 */
export function MhdInterviewGuideBuilder({ companyId, requisitionId, canManage }: Props) {
  const [guideId, setGuideId] = useState<string | null>(null);
  const [bankQuestionId, setBankQuestionId] = useState<string>('');

  const guideGetOrCreate = useMhdGuideGetOrCreate();
  const assemble = useMhdAssembleGuide();
  const addQuestion = useMhdAddGuideQuestion();
  const addCustom = useMhdAddCustomQuestion();
  const removeItem = useMhdRemoveGuideItem();

  const items = useMhdInterviewGuideItems(guideId);
  const categories = useMhdInterviewCategories(companyId);
  // The bank to add from — everything the company can see; the add filters out
  // questions already on the guide below.
  const bank = useMhdInterviewQuestions({ companyId });

  // Fire get-or-create exactly once for this requisition to obtain the guide id.
  // A ref guards against the effect re-running (and a duplicate write) under
  // React 18 strict-mode double-invoke; the RPC is idempotent regardless.
  const requestedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!canManage) return;
    if (requestedFor.current === requisitionId) return;
    requestedFor.current = requisitionId;
    guideGetOrCreate.mutate(requisitionId, {
      onSuccess: (id) => setGuideId(id),
    });
  }, [canManage, requisitionId, guideGetOrCreate]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MhdAddCustomQuestionFormValues>({
    resolver: zodResolver(mhdAddCustomQuestionSchema),
    defaultValues: {
      guideId: '',
      questionText: '',
      responseType: 'RATING_1_5',
      competencyId: '',
      saveToBank: false,
      categoryId: '',
    },
  });
  const saveToBank = watch('saveToBank');

  // Group the guide items by source, in the canonical assembly order.
  const grouped = useMemo(() => {
    const map = new Map<MhdInterviewGuideItemSource, MhdInterviewGuideItem[]>();
    for (const item of items.data ?? []) {
      const bucket = map.get(item.source) ?? [];
      bucket.push(item);
      map.set(item.source, bucket);
    }
    return MHD_INTERVIEW_GUIDE_ITEM_SOURCES.map((source) => ({
      source,
      items: map.get(source) ?? [],
    })).filter((group) => group.items.length > 0);
  }, [items.data]);

  // Bank questions not already on the guide (by question id).
  const addableBank = useMemo(() => {
    const present = new Set(
      (items.data ?? []).map((item) => item.questionId).filter(Boolean) as string[],
    );
    return (bank.data ?? []).filter((question) => !present.has(question.id));
  }, [bank.data, items.data]);

  async function handleAssemble() {
    if (!guideId) return;
    await assemble.mutateAsync(guideId);
  }

  async function handleAddBank() {
    if (!guideId || !bankQuestionId) return;
    await addQuestion.mutateAsync({ guideId, questionId: bankQuestionId });
    setBankQuestionId('');
  }

  async function handleAddCustom(values: MhdAddCustomQuestionFormValues) {
    if (!guideId) return;
    await addCustom.mutateAsync({
      guideId,
      questionText: values.questionText,
      responseType: values.responseType,
      competencyId: values.competencyId || null,
      saveToBank: values.saveToBank,
      categoryId: values.saveToBank ? values.categoryId || null : null,
    });
    reset({
      guideId: '',
      questionText: '',
      responseType: 'RATING_1_5',
      competencyId: '',
      saveToBank: false,
      categoryId: '',
    });
  }

  if (!canManage) {
    return (
      <p className="text-sm text-neutral-600">
        Building the interview guide is limited to recruiters and the hiring manager.
      </p>
    );
  }

  if (guideGetOrCreate.isPending && !guideId) {
    return <p className="text-sm text-neutral-500">Opening the guide…</p>;
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Interview guide</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Assemble pulls the standard questions and the ones matching this role&apos;s
            competencies. Re-run it any time the job description changes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleAssemble()}
          disabled={!guideId || assemble.isPending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
        >
          {assemble.isPending ? 'Assembling…' : 'Assemble from standard + job'}
        </button>
      </div>

      {assemble.isSuccess ? (
        <p className="text-xs text-emerald-700">
          Added {assemble.data} question{assemble.data === 1 ? '' : 's'} to the guide.
        </p>
      ) : null}

      {/* The assembled items, grouped by source, each with its compliance flag. */}
      {items.isLoading ? (
        <p className="text-sm text-neutral-500">Loading guide…</p>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-neutral-500">
          The guide is empty. Assemble it from the standard + job questions, or add questions below.
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.source} className="space-y-2">
              <h3 className="text-sm font-semibold text-neutral-700">
                {mhdFormatGuideItemSource(group.source)}
              </h3>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-md border border-neutral-200 bg-card p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm text-neutral-900">{item.questionText}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                          <span className="rounded bg-neutral-100 px-2 py-0.5">
                            {mhdFormatResponseType(item.responseType)}
                          </span>
                          {item.competencyName ? (
                            <span className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-700">
                              {item.competencyName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <MhdComplianceFlag status={item.complianceStatus} />
                        <button
                          type="button"
                          onClick={() => void removeItem.mutateAsync(item.id)}
                          disabled={removeItem.isPending}
                          className="text-xs text-rose-600 underline disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Add from the bank */}
      <div className="rounded-lg border border-neutral-200 p-4">
        <h3 className="text-sm font-semibold text-neutral-900">Add from the bank</h3>
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="bankQuestion" className="block text-xs font-medium text-neutral-600">
              Question
            </label>
            <select
              id="bankQuestion"
              value={bankQuestionId}
              onChange={(event) => setBankQuestionId(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Choose a bank question…</option>
              {addableBank.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.questionText}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void handleAddBank()}
            disabled={!bankQuestionId || addQuestion.isPending}
            className="rounded-md border border-neutral-300 bg-card px-4 py-2 text-sm font-medium text-neutral-700 disabled:opacity-50"
          >
            {addQuestion.isPending ? 'Adding…' : 'Add'}
          </button>
        </div>
      </div>

      {/* Add a custom question */}
      <div className="rounded-lg border border-neutral-200 p-4">
        <h3 className="text-sm font-semibold text-neutral-900">Add a custom question</h3>
        <form onSubmit={handleSubmit(handleAddCustom)} className="mt-3 space-y-4">
          <div>
            <label htmlFor="customText" className="block text-sm font-medium text-neutral-700">
              Question
            </label>
            <textarea
              id="customText"
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
              <label
                htmlFor="customResponseType"
                className="block text-sm font-medium text-neutral-700"
              >
                Response type
              </label>
              <select
                id="customResponseType"
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

            <div className="flex items-start gap-2 pt-6">
              <input
                id="saveToBank"
                type="checkbox"
                {...register('saveToBank')}
                className="mt-1 h-4 w-4 rounded border-neutral-300"
              />
              <label htmlFor="saveToBank" className="text-sm text-neutral-700">
                Save to bank
                <span className="block text-xs font-normal text-neutral-500">
                  Adds this question to the company library (as REVIEW) for reuse.
                </span>
              </label>
            </div>
          </div>

          {saveToBank ? (
            <div>
              <label htmlFor="customCategory" className="block text-sm font-medium text-neutral-700">
                Save under category{' '}
                <span className="font-normal text-neutral-500">(optional)</span>
              </label>
              <select
                id="customCategory"
                {...register('categoryId')}
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Uncategorized</option>
                {(categories.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={addCustom.isPending}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
            >
              {addCustom.isPending ? 'Adding…' : 'Add custom question'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
