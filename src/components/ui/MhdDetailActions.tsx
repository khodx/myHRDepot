import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { buttonBaseClasses, buttonVariantClasses } from './buttonStyles';
import { cn } from '@/utils/cn';

interface MhdDetailActionsProps {
  /** Route to the record's edit form. Omit to hide the Edit button entirely. */
  editTo?: string;
  /** Omit to hide the Delete button entirely. */
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  deleteConfirmMessage?: string;
  /**
   * Skip the built-in window.confirm before calling onDelete. Use this when
   * onDelete itself opens an existing reason-required flow (e.g. a cancel/
   * withdraw/rescind dialog for an audited case) rather than performing an
   * immediate destructive action — a second generic confirm on top of that
   * flow's own confirmation would be redundant and confusing.
   */
  skipConfirm?: boolean;
  className?: string;
}

/**
 * Edit + Delete pair for a record's detail page. Meant to be rendered TWICE
 * per page — once in MhdPageHeader's `actions` slot (top) and once below the
 * page content (bottom) — since Edit and Delete are only ever reachable from
 * here, never from a list row (2026-07-26: removed from MhdTableActions' row
 * menu). Edit is yellow (warning variant) so it reads as distinct from Delete
 * and from the navy primary/category accent used elsewhere on the page.
 */
export function MhdDetailActions({
  editTo,
  onDelete,
  deleteLabel = 'Delete',
  deleteConfirmMessage = 'Delete this record? This cannot be undone.',
  skipConfirm = false,
  className,
}: MhdDetailActionsProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!onDelete || deleting) return;
    if (!skipConfirm && !window.confirm(deleteConfirmMessage)) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  if (!editTo && !onDelete) return null;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {editTo ? (
        <Link
          to={editTo}
          className={cn(buttonBaseClasses, buttonVariantClasses.warning)}
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Edit Record
        </Link>
      ) : null}
      {onDelete ? (
        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="h-4 w-4" aria-hidden />
          {deleting ? 'Deleting…' : deleteLabel}
        </Button>
      ) : null}
    </div>
  );
}
