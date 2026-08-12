import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Download, Layers, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdSearchableSelect } from '@/components/ui/MhdSearchableSelect';
import { MhdTaskWorkspaceNav } from '@/appshell/components/MhdTaskWorkspaceNav';
import { MhdViewToggle } from '@/components/ui/MhdViewToggle';
import {
  mhdReadPersistedViewMode,
  mhdWritePersistedViewMode,
  type MhdViewMode,
} from '@/components/ui/MhdViewToggleUtils';
import { MhdTaskBoard } from '@/features/tasks/components/MhdTaskBoard';
import { MhdTaskFilterBar } from '@/features/tasks/components/MhdTaskFilterBar';
import { MhdTaskList } from '@/features/tasks/components/MhdTaskList';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdTasks } from '@/features/tasks/Hook';
import { mhdExportTable, type MhdExportColumn, type MhdExportFormat } from '@/lib/mhdTableExport';
import { mhdToIsoDateString } from '@/utils/mhdDateFormat';
import type { MhdTask, MhdTaskListFilters } from '@/features/tasks/Types';

const MHD_TASKS_VIEW_KEY = 'mhd:tasks:view';
const MHD_TASKS_SAVED_VIEWS_KEY = 'mhd:tasks:savedViews';
const MHD_BULK_PRIORITY_UNSELECTED = '__MHD_BULK_PRIORITY_UNSELECTED__';

interface MhdSavedTaskView {
  id: string;
  name: string;
  filters: MhdTaskListFilters;
}

function readSavedViews(): MhdSavedTaskView[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MHD_TASKS_SAVED_VIEWS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedViews(views: MhdSavedTaskView[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MHD_TASKS_SAVED_VIEWS_KEY, JSON.stringify(views));
  } catch {
    // localStorage unavailable; saved views stay in-memory for this session.
  }
}

function createSavedViewId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `view-${Date.now()}`;
}

const MHD_TASK_EXPORT_COLUMNS: MhdExportColumn<MhdTask>[] = [
  { header: 'Reference ID', accessor: (task) => task.referenceId },
  { header: 'Title', accessor: (task) => task.title },
  { header: 'Company', accessor: (task) => task.companyName },
  { header: 'Assignees', accessor: (task) => task.assignedDisplayNames.join('; ') },
  { header: 'Priority', accessor: (task) => task.priorityName ?? '' },
  { header: 'Status', accessor: (task) => task.statusName },
  { header: 'Due Date', accessor: (task) => task.dueDate ?? '' },
  {
    header: 'Progress',
    accessor: (task) => String(task.calculatedProgressPercent ?? task.manualProgressPercent),
  },
];

const MHD_TASK_EXPORT_FORMATS: Array<{ format: MhdExportFormat; label: string }> = [
  { format: 'xlsx', label: 'Excel' },
  { format: 'csv', label: 'CSV' },
  { format: 'docx', label: 'Word' },
  { format: 'pdf', label: 'PDF' },
];

export function MhdTasksPage() {
  const { profile } = useMhdAuth();
  const [viewMode, setViewMode] = useState<MhdViewMode>(() =>
    mhdReadPersistedViewMode(MHD_TASKS_VIEW_KEY),
  );

  function handleViewModeChange(mode: MhdViewMode) {
    setViewMode(mode);
    mhdWritePersistedViewMode(MHD_TASKS_VIEW_KEY, mode);
  }
  const actorContext = useMemo(
    () => (profile?.userId ? { actorUserId: profile.userId } : null),
    [profile],
  );
  // The companies feature exposes a react-query hook keyed by list filters
  // (not the actor-context state hook this page originally assumed).
  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const taskState = useMhdTasks(actorContext, profile?.companyId ?? '');
  const canEditCompany = profile?.companyIsPlatformOrg ?? false;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedBulkStatusId, setSelectedBulkStatusId] = useState('');
  const [selectedBulkPriorityId, setSelectedBulkPriorityId] = useState(MHD_BULK_PRIORITY_UNSELECTED);
  const [selectedBulkAssigneeId, setSelectedBulkAssigneeId] = useState('');
  const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');
  const [savedViews, setSavedViews] = useState<MhdSavedTaskView[]>(readSavedViews);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState('');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExportMenuOpen) return;
    function onDocClick(event: globalThis.MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [isExportMenuOpen]);

  // Derived rather than synced via effect: stale ids (from a deleted task or
  // a filter change that drops a row) simply drop out of this list on the
  // next render instead of needing an explicit reset.
  const validSelectedIds = useMemo(
    () => selectedIds.filter((id) => taskState.tasks.some((task) => task.id === id)),
    [selectedIds, taskState.tasks],
  );

  const toggleSelect = useCallback((taskId: string) => {
    setSelectedIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  }, []);

  const toggleSelectAll = useCallback((taskIds: string[]) => {
    setSelectedIds((current) => {
      const allSelected = taskIds.every((taskId) => current.includes(taskId));
      if (allSelected) return current.filter((taskId) => !taskIds.includes(taskId));
      return Array.from(new Set([...current, ...taskIds]));
    });
  }, []);

  async function handleDeleteSelected() {
    if (validSelectedIds.length === 0) return;
    await taskState.deleteTasks(validSelectedIds);
    setSelectedIds([]);
    setIsBulkModalOpen(false);
  }

  async function handleBulkStatusUpdate() {
    if (validSelectedIds.length === 0 || selectedBulkStatusId === '') return;
    await taskState.bulkUpdateStatus(validSelectedIds, selectedBulkStatusId);
    setSelectedIds([]);
    setIsBulkModalOpen(false);
  }

  async function handleBulkPriorityUpdate() {
    if (validSelectedIds.length === 0 || selectedBulkPriorityId === MHD_BULK_PRIORITY_UNSELECTED) {
      return;
    }
    await taskState.bulkUpdatePriority(
      validSelectedIds,
      selectedBulkPriorityId === '' ? null : selectedBulkPriorityId,
    );
    setSelectedIds([]);
    setIsBulkModalOpen(false);
  }

  async function handleBulkAssigneeUpdate() {
    if (validSelectedIds.length === 0 || selectedBulkAssigneeId === '') return;
    await taskState.bulkUpdateAssignees(validSelectedIds, [selectedBulkAssigneeId]);
    setSelectedIds([]);
    setIsBulkModalOpen(false);
  }

  function handleSaveView(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = saveViewName.trim();
    if (!name) return;
    const nextViews = [
      ...savedViews,
      { id: createSavedViewId(), name, filters: taskState.filters },
    ];
    setSavedViews(nextViews);
    writeSavedViews(nextViews);
    setSaveViewName('');
    setIsSaveViewModalOpen(false);
  }

  function handleApplySavedView(viewId: string) {
    setSelectedSavedViewId(viewId);
    const view = savedViews.find((savedView) => savedView.id === viewId);
    if (!view) return;
    taskState.setFilters({
      ...view.filters,
      companyId: canEditCompany ? view.filters.companyId : profile?.companyId ?? view.filters.companyId,
    });
  }

  function handleDeleteSavedView(viewId: string) {
    const nextViews = savedViews.filter((view) => view.id !== viewId);
    setSavedViews(nextViews);
    writeSavedViews(nextViews);
    if (selectedSavedViewId === viewId) setSelectedSavedViewId('');
  }

  function handleExport(format: MhdExportFormat) {
    setIsExportMenuOpen(false);
    setExportErrorMessage(null);
    mhdExportTable({
      format,
      filenameBase: `tasks-export-${mhdToIsoDateString()}`,
      title: 'Task Dashboard',
      columns: MHD_TASK_EXPORT_COLUMNS,
      rows: taskState.tasks,
    }).catch((error: unknown) => {
      const label = MHD_TASK_EXPORT_FORMATS.find((f) => f.format === format)?.label ?? format;
      setExportErrorMessage(
        `Unable to export tasks as ${label}: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
  }

  return (
    <div className="space-y-6">
      <MhdTaskWorkspaceNav />

      <header className="space-y-2">
        {/* Row 1: title left-justified, Saved Views right-justified. */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[32px] font-semibold leading-tight text-foreground">Task Dashboard</h1>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Saved Views
              </span>
              <select
                className="h-10 w-56 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                value={selectedSavedViewId}
                onChange={(event) => handleApplySavedView(event.target.value)}
              >
                <option value="">Select saved view</option>
                {savedViews.map((view) => (
                  <option key={view.id} value={view.id}>
                    {view.name}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="ghost"
              className="h-10 w-10 px-0"
              disabled={!selectedSavedViewId}
              onClick={() => handleDeleteSavedView(selectedSavedViewId)}
              aria-label="Delete selected saved view"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Row 2: plain description text. */}
        <p className="max-w-4xl text-[15px] text-muted-foreground">
          Create, assign, filter, and track client work across companies. Use list and board views
          to monitor ownership, progress, and upcoming due dates.
        </p>

        {/* Row 3: New Task, Bulk Actions, Save View, Export — sized/spaced to
            match the record-detail tab row (MhdTaskRecordTabs: h-9, px-3,
            text-[16.8px], primary/secondary pills) rather than the default
            h-10 action-button size. Task Reports/Audit Reports now live in
            the persistent MhdTaskWorkspaceNav above instead of this row. */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            to="/tasks/new"
            className={cn(buttonBaseClasses, buttonVariantClasses.primary, 'h-9 gap-1.5 px-3 text-[16.8px]')}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New Task
          </Link>
          <Button
            variant="secondary"
            className="h-9 gap-1.5 px-3 text-[16.8px]"
            disabled={validSelectedIds.length === 0 || taskState.isSaving}
            onClick={() => setIsBulkModalOpen(true)}
          >
            <Layers className="h-4 w-4" aria-hidden />
            Bulk Actions
          </Button>
          <Button
            variant="secondary"
            className="h-9 gap-1.5 px-3 text-[16.8px]"
            onClick={() => setIsSaveViewModalOpen(true)}
          >
            <Save className="h-4 w-4" aria-hidden />
            Save View
          </Button>
          <div ref={exportMenuRef} className="relative inline-block text-left">
            <Button
              variant="secondary"
              className="h-9 gap-1.5 px-3 text-[16.8px]"
              disabled={taskState.tasks.length === 0}
              aria-haspopup="menu"
              aria-expanded={isExportMenuOpen}
              onClick={() => setIsExportMenuOpen((prev) => !prev)}
            >
              <Download className="h-4 w-4" aria-hidden />
              Export
            </Button>
            {isExportMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-md border border-border bg-card py-1 shadow-lg"
              >
                {MHD_TASK_EXPORT_FORMATS.map((exportFormat) => (
                  <button
                    key={exportFormat.format}
                    type="button"
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left text-xs font-medium text-foreground transition hover:bg-accent-soft"
                    onClick={() => handleExport(exportFormat.format)}
                  >
                    {exportFormat.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {exportErrorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {exportErrorMessage}
        </div>
      )}

      {taskState.errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {taskState.errorMessage}
        </div>
      )}

      <MhdTaskFilterBar
        companies={companies}
        statuses={taskState.statuses}
        priorities={taskState.priorities}
        assignableUsers={taskState.assignableUsers}
        filters={taskState.filters}
        onChange={taskState.setFilters}
        canEditCompany={canEditCompany}
        currentUserCompanyId={profile?.companyId ?? ''}
      />

      <div className="flex justify-end">
        <MhdViewToggle value={viewMode} onChange={handleViewModeChange} />
      </div>

      {viewMode === 'board' ? (
        <MhdTaskBoard
          tasks={taskState.tasks}
          statuses={taskState.statuses}
          isLoading={taskState.isLoading}
        />
      ) : (
        <MhdTaskList
          tasks={taskState.tasks}
          isLoading={taskState.isLoading}
          onDelete={taskState.deleteTask}
          selectedIds={validSelectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      )}

      {isBulkModalOpen && (
        <MhdModal onClose={() => setIsBulkModalOpen(false)} title="Bulk Actions">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Bulk Actions</h2>
            <p className="text-sm text-muted-foreground">
              {validSelectedIds.length} selected task{validSelectedIds.length === 1 ? '' : 's'}
            </p>

            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Change Status</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  className="h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  value={selectedBulkStatusId}
                  onChange={(event) => setSelectedBulkStatusId(event.target.value)}
                >
                  <option value="">Select status</option>
                  {taskState.statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.statusName}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  disabled={selectedBulkStatusId === '' || taskState.isSaving}
                  onClick={() => void handleBulkStatusUpdate()}
                >
                  Apply
                </Button>
              </div>
            </section>

            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Change Priority</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  className="h-10 flex-1 rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  value={selectedBulkPriorityId}
                  onChange={(event) => setSelectedBulkPriorityId(event.target.value)}
                >
                  <option value={MHD_BULK_PRIORITY_UNSELECTED}>Select priority</option>
                  <option value="">No priority</option>
                  {taskState.priorities.map((priority) => (
                    <option key={priority.id} value={priority.id}>
                      {priority.priorityName}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  disabled={
                    selectedBulkPriorityId === MHD_BULK_PRIORITY_UNSELECTED || taskState.isSaving
                  }
                  onClick={() => void handleBulkPriorityUpdate()}
                >
                  Apply
                </Button>
              </div>
            </section>

            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Change Assignee</h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <MhdSearchableSelect
                  className="flex-1"
                  options={taskState.assignableUsers.map((user) => ({
                    id: user.id,
                    label: user.displayName,
                    sublabel: user.email || undefined,
                  }))}
                  value={selectedBulkAssigneeId}
                  onChange={setSelectedBulkAssigneeId}
                  placeholder="Select assignee"
                  emptyMessage="No assignable users match your search."
                />
                <Button
                  type="button"
                  disabled={selectedBulkAssigneeId === '' || taskState.isSaving}
                  onClick={() => void handleBulkAssigneeUpdate()}
                >
                  Apply
                </Button>
              </div>
            </section>

            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">Delete Selected</h3>
              <p className="text-sm text-muted-foreground">
                Delete selected tasks permanently?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsBulkModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={taskState.isSaving}
                  onClick={() => void handleDeleteSelected()}
                >
                  Delete selected
                </Button>
              </div>
            </section>
          </div>
        </MhdModal>
      )}

      {isSaveViewModalOpen && (
        <MhdModal onClose={() => setIsSaveViewModalOpen(false)} title="Save View">
          <form className="space-y-4" onSubmit={(event) => handleSaveView(event)}>
            <h2 className="text-lg font-semibold text-foreground">Save View</h2>
            <label className="block text-sm font-medium text-foreground">
              Name
              <input
                autoFocus
                value={saveViewName}
                onChange={(event) => setSaveViewName(event.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsSaveViewModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveViewName.trim().length === 0}>
                Save view
              </Button>
            </div>
          </form>
        </MhdModal>
      )}
    </div>
  );
}
