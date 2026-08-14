import { cn } from '@/utils/cn';

type MhdAvatarSize = 'sm' | 'md' | 'lg';

interface MhdAvatarProps {
  name: string;
  /** Signed photo URL (see useMhdPersonPhotoUrl) — renders as an image in
   *  place of the initials circle when present. */
  photoUrl?: string | null;
  /** Secondary line in the labeled form, typically the email. */
  detail?: string;
  size?: MhdAvatarSize;
  className?: string;
}

const mhdAvatarSizeClasses: Record<MhdAvatarSize, string> = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-14 w-14 text-lg',
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

interface MhdAvatarCircleProps {
  name: string;
  photoUrl?: string | null;
  size?: MhdAvatarSize;
  className?: string;
}

/**
 * The bare circle — a photo when one resolved, otherwise initials. Shared by
 * every place that renders a person's identity as a standalone bubble (the
 * topbar identity menu, the person detail page, the dashboard greeting) so
 * the photo/initials fallback logic lives in exactly one place rather than
 * being reimplemented per call site (each previously rolled its own inline
 * initials `<div>`). `MhdAvatar` below wraps this for the name+detail table
 * cell layout; use this directly wherever only the bubble itself is wanted.
 */
export function MhdAvatarCircle({ name, photoUrl, size = 'md', className }: MhdAvatarCircleProps) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={cn(
          'shrink-0 rounded-md bg-accent-tint object-cover',
          mhdAvatarSizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-accent-tint font-semibold text-accent-hover',
        mhdAvatarSizeClasses[size],
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

/** Initials/photo circle in the module accent tint; pass `detail` for the table's name+email cell. */
export function MhdAvatar({ name, photoUrl, detail, size = 'md', className }: MhdAvatarProps) {
  const circle = <MhdAvatarCircle name={name} photoUrl={photoUrl} size={size} />;
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
