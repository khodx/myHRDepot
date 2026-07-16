import type { MhdNoteVisibility } from '../Types';

const visibilityStyles: Record<MhdNoteVisibility, string> = {
  PUBLIC: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ADMIN: 'bg-purple-50 text-purple-700 ring-purple-200',
  PRIVATE: 'bg-slate-100 text-slate-700 ring-slate-300',
};

export function MhdNoteVisibilityBadge({ visibility }: { visibility: MhdNoteVisibility }) {
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${visibilityStyles[visibility]}`}>{visibility}</span>;
}
