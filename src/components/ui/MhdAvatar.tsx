import { cn } from '@/utils/cn';

interface MhdAvatarProps {
  name: string;
  /** Secondary line in the labeled form, typically the email. */
  detail?: string;
  size?: 'sm' | 'md';
  className?: string;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

/** Initials circle in the module accent tint; pass `detail` for the table's name+email cell. */
export function MhdAvatar({ name, detail, size = 'md', className }: MhdAvatarProps) {
  const circle = (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-accent-tint font-semibold text-accent-hover',
        size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
      )}
    >
      {initialsOf(name)}
    </span>
  );
  if (!detail) {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        {circle}
        <span className="text-sm text-foreground">{name}</span>
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {circle}
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
    </span>
  );
}
