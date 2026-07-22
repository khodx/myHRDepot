import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import {
  useMhdCreateReviewTemplate,
  useMhdPublishReviewTemplate,
  useMhdReviewTemplates,
} from '../Hook-v2';
import {
  MHD_SECTION_RESPONSE_TYPES,
  mhdFormatReviewTemplateStatus,
  mhdFormatSectionResponseType,
} from '../Types-v2';
import { mhdReviewTemplateSchema, type MhdReviewTemplateFormValues } from '../Schemas-v2';

interface Props {
  companyId: string;
  /** Platform Admins may author the null-company GLOBAL DEFAULT; company admins may not. */
  isPlatformAdmin: boolean;
}

/**
 * Lists the review templates a company can draw on — the global default plus its
 * own — and authors new ones.
 *
 * A published template is IMMUTABLE (`trg_performance_templates_immutable`): a
 * completed review has to stay explicable under the exact template that produced
 * it, so there is no edit path here, only create and publish. Publishing archives
 * whichever version is currently published; changing a published template means
 * drafting and publishing a new one.
 */
export function MhdReviewTemplateEditor({ companyId, isPlatformAdmin }: Props) {
  const templatesQuery = useMhdReviewTemplates(companyId);
  const createTemplate = useMhdCreateReviewTemplate(companyId);
  const publishTemplate = useMhdPublishReviewTemplate(companyId);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MhdReviewTemplateFormValues>({
    resolver: zodResolver(mhdReviewTemplateSchema),
    defaultValues: {
      companyId,
      templateName: '',
      versionNumber: 1,
      description: '',
      sections: [{ sectionTitle: '', prompt: '', responseType: 'RATING_AND_TEXT', sortOrder: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'sections' });

  // `companyId: null` is the global default, a different authorisation from a
  // company template — so it is tracked in the form value the resolver sees, not
  // computed only at submit time.
  const isGlobal = watch('companyId') == null;

  const onSubmit = handleSubmit((values) => {
    createTemplate.mutate(
      {
        companyId: values.companyId ?? null,
        templateName: values.templateName,
        description: values.description ?? null,
        sections: values.sections.map((section) => ({
          sectionTitle: section.sectionTitle,
          prompt: section.prompt ?? null,
          responseType: section.responseType,
        })),
      },
      {
        onSuccess: () => {
          reset({
            companyId: isGlobal ? null : companyId,
            templateName: '',
            versionNumber: 1,
            description: '',
            sections: [
              { sectionTitle: '', prompt: '', responseType: 'RATING_AND_TEXT', sortOrder: 0 },
            ],
          });
        },
      },
    );
  });

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-neutral-900">Review templates</h2>
        {templatesQuery.isLoading ? (
          <p className="text-sm text-neutral-500">Loading templates…</p>
        ) : templatesQuery.isError ? (
          <p className="text-sm text-rose-600">Templates could not be loaded.</p>
        ) : !templatesQuery.data || templatesQuery.data.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No templates yet. The first one you publish becomes available to start reviews.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200">
            {templatesQuery.data.map((template) => (
              <li key={template.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {template.templateName}
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      v{template.versionNumber} · {template.referenceId}
                    </span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    {template.isGlobal ? 'Global default' : 'Company template'} ·{' '}
                    {mhdFormatReviewTemplateStatus(template.status)} ·{' '}
                    {template.sectionCount} section{template.sectionCount === 1 ? '' : 's'}
                  </p>
                </div>
                {template.status === 'DRAFT' ? (
                  <button
                    type="button"
                    onClick={() => publishTemplate.mutate({ templateId: template.id })}
                    disabled={publishTemplate.isPending}
                    className="shrink-0 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 disabled:opacity-50"
                  >
                    {publishTemplate.isPending ? 'Publishing…' : 'Publish'}
                  </button>
                ) : (
                  <span className="shrink-0 text-xs text-neutral-400">
                    {mhdFormatReviewTemplateStatus(template.status)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {publishTemplate.isError ? (
          <p className="text-xs text-rose-600">Publishing failed. Nothing was changed.</p>
        ) : null}
        <p className="text-xs text-neutral-500">
          Publishing archives the currently published version. A published template cannot be
          edited — to change it, create a new version and publish that.
        </p>
      </section>

      <form onSubmit={onSubmit} className="space-y-6">
        <h2 className="text-base font-semibold text-neutral-900">New template</h2>

        {isPlatformAdmin ? (
          <label className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={isGlobal}
              onChange={(event) =>
                setValue('companyId', event.target.checked ? null : companyId, {
                  shouldValidate: true,
                })
              }
            />
            <span>
              Publish as the <strong>global default</strong> (available to every company). Platform
              Admins only.
            </span>
          </label>
        ) : null}

        <div>
          <label htmlFor="templateName" className="block text-sm font-medium text-neutral-700">
            Template name
          </label>
          <input
            id="templateName"
            {...register('templateName')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {errors.templateName ? (
            <p className="mt-1 text-xs text-rose-600">{errors.templateName.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
            Description <span className="font-normal text-neutral-400">(optional)</span>
          </label>
          <textarea
            id="description"
            rows={2}
            {...register('description')}
            className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          {errors.description ? (
            <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
          ) : null}
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-neutral-700">Sections</legend>
          <div className="mt-2 space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-2 rounded-md border border-neutral-200 px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm text-neutral-400">{index + 1}.</span>
                  <input
                    placeholder="Section title"
                    {...register(`sections.${index}.sectionTitle` as const)}
                    className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                  />
                  <select
                    {...register(`sections.${index}.responseType` as const)}
                    className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                  >
                    {MHD_SECTION_RESPONSE_TYPES.map((responseType) => (
                      <option key={responseType} value={responseType}>
                        {mhdFormatSectionResponseType(responseType)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-sm text-neutral-500 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Prompt shown to the rater (optional)"
                  {...register(`sections.${index}.prompt` as const)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
                />
                {/* sortOrder is carried by array position; kept in the payload so the
                    stored order matches what is on screen. */}
                <input
                  type="hidden"
                  value={index}
                  {...register(`sections.${index}.sortOrder` as const, { valueAsNumber: true })}
                />
                {errors.sections?.[index]?.sectionTitle ? (
                  <p className="text-xs text-rose-600">
                    {errors.sections[index]?.sectionTitle?.message}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              append({
                sectionTitle: '',
                prompt: '',
                responseType: 'RATING_AND_TEXT',
                sortOrder: fields.length,
              })
            }
            className="mt-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700"
          >
            Add section
          </button>
          {errors.sections?.message ? (
            <p className="mt-1 text-xs text-rose-600">{errors.sections.message}</p>
          ) : null}
        </fieldset>

        {createTemplate.isError ? (
          <p className="text-xs text-rose-600">The template could not be created.</p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createTemplate.isPending}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-50 disabled:opacity-50"
          >
            {createTemplate.isPending ? 'Creating…' : 'Create draft'}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          A new template starts as a draft. Review it, then publish it above to make it usable.
        </p>
      </form>
    </div>
  );
}
