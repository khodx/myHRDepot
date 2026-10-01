import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { MhdRichTextEditor } from '@/components/ui/MhdRichText';
import { mhdPlainTextToRichHtml } from '@/components/ui/MhdRichTextUtils';
import { useMhdKbCategories, useMhdKbComplianceEntries } from '../Hook';
import { mhdKbArticleFormSchema, type MhdKbArticleFormValues } from '../Schemas';
import type { MhdKbArticleAdmin } from '../Types';
import {
  MHD_KB_ACCESS_LEVEL_LABELS,
  MHD_KB_ARTICLE_TYPE_LABELS,
  MHD_KB_COMPANY_ACCESS_LEVELS,
  MHD_KB_PLATFORM_ACCESS_LEVELS,
} from '../Types';

interface Props {
  article?: MhdKbArticleAdmin;
  onSubmit: (values: MhdKbArticleFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  scope: 'PLATFORM' | 'COMPANY';
}

const input =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground';

export function MhdKbArticleForm({ article, onSubmit, onCancel, isSubmitting, scope }: Props) {
  const categories = useMhdKbCategories();
  const complianceEntries = useMhdKbComplianceEntries();
  const isPlatform = scope === 'PLATFORM';
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MhdKbArticleFormValues>({
    resolver: zodResolver(mhdKbArticleFormSchema),
    defaultValues: {
      categoryId: article?.categoryId ?? '',
      slug: isPlatform ? (article?.slug ?? '') : '',
      articleType: article?.articleType ?? 'ARTICLE',
      title: article?.title ?? '',
      summary: article?.summary ?? '',
      body:
        article?.bodyFormat === 'plain'
          ? mhdPlainTextToRichHtml(article.body)
          : (article?.body ?? ''),
      accessLevel: article?.accessLevel ?? (isPlatform ? 'PUBLIC' : 'COMPANY'),
      complianceRegistryId: isPlatform ? (article?.complianceRegistryId ?? null) : null,
      routeContext: article?.routeContext.join(', ') ?? '',
      searchKeywords: article?.searchKeywords ?? '',
    },
  });
  const articleType = useWatch({ control, name: 'articleType' });
  const accessLevels = isPlatform ? MHD_KB_PLATFORM_ACCESS_LEVELS : MHD_KB_COMPANY_ACCESS_LEVELS;
  const fieldError = (name: keyof MhdKbArticleFormValues) =>
    errors[name] ? <p className="mt-1 text-xs text-rose-600">{errors[name]?.message}</p> : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <label className="block text-sm font-medium">
        Category
        <select {...register('categoryId')} className={input}>
          <option value="">Select a category</option>
          {(categories.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        {fieldError('categoryId')}
      </label>
      <label className="block text-sm font-medium">
        Article Type
        <select {...register('articleType')} className={input}>
          {Object.entries(MHD_KB_ARTICLE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {isPlatform ? (
        <label className="block text-sm font-medium">
          Slug (Optional)
          <input {...register('slug')} className={input} />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Leave blank to generate from the title.
          </span>
          {fieldError('slug')}
        </label>
      ) : null}
      <label className="block text-sm font-medium">
        {articleType === 'FAQ' ? 'Question' : 'Title'}
        <input {...register('title')} className={input} />
        {fieldError('title')}
      </label>
      <label className="block text-sm font-medium">
        Summary
        <input {...register('summary')} className={input} />
        {fieldError('summary')}
      </label>
      <Controller
        name="body"
        control={control}
        render={({ field }) => (
          <div>
            <MhdRichTextEditor
              label={articleType === 'FAQ' ? 'Answer' : 'Body'}
              html={field.value}
              onChange={(html) => field.onChange(html)}
            />
            {fieldError('body')}
          </div>
        )}
      />
      <label className="block text-sm font-medium">
        Search Keywords
        <input {...register('searchKeywords')} className={input} />
        {fieldError('searchKeywords')}
      </label>
      <label className="block text-sm font-medium">
        Access Level
        <select {...register('accessLevel')} className={input}>
          {accessLevels.map((level) => (
            <option key={level} value={level}>
              {MHD_KB_ACCESS_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </label>
      {isPlatform ? (
        <label className="block text-sm font-medium">
          Compliance Entry
          <select {...register('complianceRegistryId')} className={input}>
            <option value="">None</option>
            {(complianceEntries.data ?? []).map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.contentKey} — version {entry.version} ({entry.reviewStatus})
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Regulated articles stay unpublished until the compliance entry is approved and enabled.
          </span>
        </label>
      ) : null}
      <label className="block text-sm font-medium">
        Route Context
        <span className="font-normal text-muted-foreground"> (comma-separated paths)</span>
        <input {...register('routeContext')} className={input} />
        {fieldError('routeContext')}
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Article'}
        </Button>
      </div>
    </form>
  );
}
