import { useCallback, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Download, Layers, Plus, Save, Trash2 } from 'lucide-react';
import { Button, buttonBaseClasses, buttonVariantClasses } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { MhdModal } from '@/components/ui/MhdModal';
import {
  MhdViewToggle,
  mhdReadPersistedViewMode,
  mhdWritePersistedViewMode,
  type MhdViewMode,
} from '@/components/ui/MhdViewToggle';
import { MhdTaskBoard } from '@/features/tasks/components/MhdTaskBoard';
import { MhdTaskFilterBar } from '@/features/tasks/components/MhdTaskFilterBar';
import { MhdTaskList } from '@/features/tasks/components/MhdTaskList';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import { useMhdTasks } from '@/features/tasks/Hook';
import {
  MHD_SIMPLYHR_COMPANY_ID,
  type MhdTask,
  type MhdTaskListFilters,
} from '@/features/tasks/Types';

const MHD_TASKS_VIEW_KEY = 'mhd:tasks:view';
const MHD_TASKS_SAVED_VIEWS_KEY = 'mhd:tasks:savedViews';

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

function escapeCsvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildTasksCsv(tasks: MhdTask[]): string {
  const headers = [
    'Reference ID',
    'Title',
    'Company',
    'Assignees',
    'Priority',
    'Status',
    'Due Date',
    'Progress',
  ];
  const rows = tasks.map((task) => [
    task.referenceId,
    task.title,
    task.companyName,
    task.assignedDisplayNames.join('; '),
    task.priorityName ?? '',
    task.statusName,
    task.dueDate ?? '',
    task.calculatedProgressPercent ?? task.manualProgressPercent,
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

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
  const canEditCompany = profile?.companyId === MHD_SIMPLYHR_COMPANY_ID;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');
  const [savedViews, setSavedViews] = useState<MhdSavedTaskView[]>(readSavedViews);
  const [selectedSavedViewId, setSelectedSavedViewId] = useState('');

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

  function handleExport() {
    const csv = buildTasksCsv(taskState.tasks);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `tasks-export-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
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

        {/* Row 3: New Task, Bulk Actions, Save View, Export. */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Link
            to="/tasks/new"
            className={cn(buttonBaseClasses, buttonVariantClasses.primary, 'gap-1.5')}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New Task
          </Link>
          <Button
            variant="secondary"
            className="gap-1.5"
            disabled={validSelectedIds.length === 0 || taskState.isSaving}
            onClick={() => setIsBulkModalOpen(true)}
          >
            <Layers className="h-4 w-4" aria-hidden />
            Bulk Actions
          </Button>
          <Button
            variant="secondary"
            className="gap-1.5"
            onClick={() => setIsSaveViewModalOpen(true)}
          >
            <Save className="h-4 w-4" aria-hidden />
            Save View
          </Button>
          <Button
            variant="secondary"
            className="gap-1.5"
            disabled={taskState.tasks.length === 0}
            onClick={handleExport}
          >
            <Download className="h-4 w-4" aria-hidden />
            Export
          </Button>
        </div>
      </header>

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
              Delete {validSelectedIds.length} selected task{validSelectedIds.length === 1 ? '' : 's'}?
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
