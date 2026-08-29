import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { useMhdKbCategories } from '../Hook';
import { mhdKbArticleFormSchema, type MhdKbArticleFormValues } from '../Schemas';
import type { MhdKbArticleAdmin } from '../Types';

interface Props {
  article?: MhdKbArticleAdmin;
  onSubmit: (values: MhdKbArticleFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}
const input =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground';
export function MhdKbArticleForm({ article, onSubmit, onCancel, isSubmitting }: Props) {
  const categories = useMhdKbCategories();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdKbArticleFormValues>({
    resolver: zodResolver(mhdKbArticleFormSchema),
    defaultValues: {
      categoryId: article?.categoryId ?? '',
      slug: article?.slug ?? '',
      title: article?.title ?? '',
      summary: article?.summary ?? '',
      body: article?.body ?? '',
      audience: article?.audience ?? 'both',
      routeContext: article?.routeContext.join(', ') ?? '',
      searchKeywords: article?.searchKeywords ?? '',
    },
  });
  const fieldError = (name: keyof MhdKbArticleFormValues) =>
    errors[name] ? <p className="mt-1 text-xs text-rose-600">{errors[name]?.message}</p> : null;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <label className="block text-sm font-medium">
        Category
        <select {...register('categoryId')} className={input}>
          <option value="">Select a category</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        {fieldError('categoryId')}
      </label>
      {(['slug', 'title', 'summary', 'searchKeywords'] as const).map((name) => (
        <label key={name} className="block text-sm font-medium">
          {name === 'searchKeywords' ? 'Search keywords' : name[0].toUpperCase() + name.slice(1)}
          <input {...register(name)} className={input} />
          {fieldError(name)}
        </label>
      ))}
      <label className="block text-sm font-medium">
        Body
        <textarea rows={7} {...register('body')} className={input} />
        {fieldError('body')}
      </label>
      <label className="block text-sm font-medium">
        Audience
        <select {...register('audience')} className={input}>
          <option value="end_user">End user</option>
          <option value="internal">Internal</option>
          <option value="both">Both</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Route context{' '}
        <span className="font-normal text-muted-foreground">(comma-separated paths)</span>
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
