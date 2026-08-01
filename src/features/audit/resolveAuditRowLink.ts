// Shared row-click navigation logic for both audit timeline tables
// (per-task MhdTaskAuditPage and company-wide MhdAuditReportsPage), so the
// two pages never drift on where a given entity_type/entity_id row leads.

export interface MhdAuditRowLinkTarget {
  entityType: string;
  entityId: string;
}

export interface MhdAuditRowLinkContext {
  /** The task id the current page is already scoped to (per-task audit page).
   *  When set, NOTE/ATTACHMENT rows resolve directly against it — those
   *  entity types have no standalone detail page, so the closest real target
   *  is the parent task's Notes/Attachments tab. */
  taskId?: string | null;
  /**
   * Resolves a NOTE/ATTACHMENT row's OWN entity_id (the note/attachment id,
   * not a task id) to its parent task id, for pages that are not already
   * scoped to one task (the company-wide Audit Reports page). No such lookup
   * RPC exists today (see notes/attachments Service.ts — both only list by
   * entity_type/entity_id, never resolve a note/attachment id back to its
   * parent). Leave unset to fall back to the "unresolved" case below rather
   * than guessing at a broken link.
   */
  resolveParentTaskId?: (entityType: 'NOTE' | 'ATTACHMENT', entityId: string) => string | null;
}

/**
 * Returns the route a timeline row should navigate to, or null when no
 * resolvable target exists (row stays non-navigating, or the caller may
 * surface a "no detail view available" message instead — see
 * MhdAuditTimelineTable's onUnresolvedRowClick).
 */
export function resolveMhdAuditRowLink(
  entry: MhdAuditRowLinkTarget,
  context: MhdAuditRowLinkContext = {},
): string | null {
  switch (entry.entityType) {
    case 'TASK':
      return `/tasks/${entry.entityId}`;
    case 'ACTIVITY':
      return `/activities/${entry.entityId}`;
    case 'NOTE': {
      const taskId = context.taskId ?? context.resolveParentTaskId?.('NOTE', entry.entityId) ?? null;
      return taskId ? `/tasks/${taskId}/notes` : null;
    }
    case 'ATTACHMENT': {
      const taskId =
        context.taskId ?? context.resolveParentTaskId?.('ATTACHMENT', entry.entityId) ?? null;
      return taskId ? `/tasks/${taskId}/attachments` : null;
    }
    case 'DOCUMENT_GENERATION': {
      // A document_generations row has no standalone detail page of its own
      // — its full Download/Customize/Generate/Upload actions and
      // Generation History (with a Download link per generation) already
      // live on the requesting record's Reports tab (MhdDocumentGenerationPanel,
      // src/features/documents/components/), same reasoning as NOTE/ATTACHMENT.
      // Company-wide audit_events rows for a generation don't carry the
      // requesting task's own id (only the generation's own id), so this
      // only resolves when the per-task page's taskId context is already
      // known — same limitation as NOTE/ATTACHMENT on the company-wide page.
      return context.taskId ? `/tasks/${context.taskId}/reports` : null;
    }
    default:
      return null;
  }
}

/** Entity types whose row IS meant to be clickable even when
 *  resolveMhdAuditRowLink currently returns null for it (NOTE/ATTACHMENT on
 *  a page with no parent-task resolution available) — used to decide whether
 *  to still attach a click handler that surfaces the "no detail view
 *  available" fallback message, versus leaving the row inert. */
export function mhdAuditRowHasKnownLinkShape(entityType: string): boolean {
  return (
    entityType === 'TASK' ||
    entityType === 'ACTIVITY' ||
    entityType === 'NOTE' ||
    entityType === 'ATTACHMENT' ||
    entityType === 'DOCUMENT_GENERATION'
  );
}
