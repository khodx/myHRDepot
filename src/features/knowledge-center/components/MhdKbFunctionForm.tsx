import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { mhdKbFunctionFormSchema, type MhdKbFunctionFormValues } from '../Schemas';
import type { MhdKbFunctionAdmin } from '../Types';
import { MHD_KB_ACCESS_LEVEL_LABELS, MHD_KB_PLATFORM_ACCESS_LEVELS } from '../Types';
interface Props {
  func?: MhdKbFunctionAdmin;
  onSubmit: (values: MhdKbFunctionFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}
const input =
  'mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground';
export function MhdKbFunctionForm({ func, onSubmit, onCancel, isSubmitting }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MhdKbFunctionFormValues>({
    resolver: zodResolver(mhdKbFunctionFormSchema),
    defaultValues: {
      name: func?.name ?? '',
      category: func?.category ?? '',
      syntax: func?.syntax ?? '',
      description: func?.description ?? '',
      exampleInput: func?.exampleInput ?? '',
      exampleOutput: func?.exampleOutput ?? '',
      relatedEngine:
        (func?.relatedEngine as MhdKbFunctionFormValues['relatedEngine']) ?? 'calculator',
      accessLevel: func?.accessLevel ?? 'PUBLIC',
      isDeprecated: func?.isDeprecated ?? false,
    },
  });
  const fieldError = (name: keyof MhdKbFunctionFormValues) =>
    errors[name] ? <p className="mt-1 text-xs text-rose-600">{errors[name]?.message}</p> : null;
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {(['name', 'category', 'syntax'] as const).map((name) => (
        <label key={name} className="block text-sm font-medium">
          {name[0].toUpperCase() + name.slice(1)}
          <input {...register(name)} className={input} />
          {fieldError(name)}
        </label>
      ))}
      {(['description', 'exampleInput', 'exampleOutput'] as const).map((name) => (
        <label key={name} className="block text-sm font-medium">
          {name === 'exampleInput'
            ? 'Example Input'
            : name === 'exampleOutput'
              ? 'Example Output'
              : 'Description'}
          <textarea rows={name === 'description' ? 4 : 3} {...register(name)} className={input} />
          {fieldError(name)}
        </label>
      ))}
      <label className="block text-sm font-medium">
        Related Engine
        <select {...register('relatedEngine')} className={input}>
          <option value="calculator">Calculator</option>
          <option value="automation">Automation</option>
          <option value="forms">Forms</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Access Level
        <select {...register('accessLevel')} className={input}>
          {MHD_KB_PLATFORM_ACCESS_LEVELS.map((level) => (
            <option key={level} value={level}>
              {MHD_KB_ACCESS_LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </label>
      {func ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('isDeprecated')} /> Deprecated
        </label>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save Function'}
        </Button>
      </div>
    </form>
  );
}
