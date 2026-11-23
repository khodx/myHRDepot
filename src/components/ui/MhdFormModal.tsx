import type { ReactNode } from 'react';
import { MhdModal } from '@/components/ui/MhdModal';

type MhdFormModalSize = 'md' | 'lg' | 'xl';

const MODAL_WIDTH: Record<MhdFormModalSize, string> = {
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

interface MhdFormModalProps {
  title: string;
  description?: string;
  onClose: () => void;
  size?: MhdFormModalSize;
  children: ReactNode;
}

/**
 * The modal popup every input screen uses: a visible heading and optional description above the form, a width
 * (md/lg/xl), and the shared MhdModal behaviour (portal, focus trap, Escape and backdrop close, scrolling body).
 * Pair it with MhdDraftBanner and MhdSaveDraftButton from MhdDraftControls for save and resume.
 */
export function MhdFormModal({ title, description, onClose, size = 'lg', children }: MhdFormModalProps) {
  return (
    <MhdModal
      onClose={onClose}
      title={title}
      className={`relative flex w-full ${MODAL_WIDTH[size]} flex-col rounded-lg border border-border bg-background shadow-xl`}
    >
      <div className="mb-4 space-y-1 pr-10">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </MhdModal>
  );
}
