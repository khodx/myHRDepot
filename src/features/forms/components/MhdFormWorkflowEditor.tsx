import type {
  MhdFormWorkflowAction,
  MhdFormWorkflowDefinition,
  MhdFormWorkflowRole,
  MhdFormWorkflowStatus,
  MhdFormWorkflowTaskView,
} from '../Types';

interface MhdFormWorkflowEditorProps {
  workflow: MhdFormWorkflowDefinition;
  onChange: (workflow: MhdFormWorkflowDefinition) => void;
}

const triggerEvents: MhdFormWorkflowAction['triggerEvent'][] = [
  'SUBMIT',
  'SAVE',
  'UPDATE',
  'STATUS_CHANGE',
  'PAYMENT_COMPLETE',
  'TASK_COMPLETE',
  'MANUAL',
];

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 9999)}`;
}

export function MhdFormWorkflowEditor({ workflow, onChange }: MhdFormWorkflowEditorProps) {
  const updateStatus = (statusId: string, patch: Partial<MhdFormWorkflowStatus>) => {
    onChange({
      ...workflow,
      statuses: workflow.statuses.map((status) =>
        status.id === statusId ? { ...status, ...patch } : status,
      ),
    });
  };

  const updateRole = (roleId: string, patch: Partial<MhdFormWorkflowRole>) => {
    onChange({
      ...workflow,
      roles: workflow.roles.map((role) => (role.id === roleId ? { ...role, ...patch } : role)),
    });
  };

  const updateAction = (actionId: string, patch: Partial<MhdFormWorkflowAction>) => {
    onChange({
      ...workflow,
      actions: workflow.actions.map((action) =>
        action.id === actionId ? { ...action, ...patch } : action,
      ),
    });
  };

  const updateTaskView = (taskId: string, patch: Partial<MhdFormWorkflowTaskView>) => {
    onChange({
      ...workflow,
      taskViews: workflow.taskViews.map((task) =>
        task.id === taskId ? { ...task, ...patch } : task,
      ),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['enabled', 'Workflow Enabled'],
          ['saveAndResume', 'Save & Resume'],
          ['workflowLinkSharing', 'Workflow Links'],
          ['formReadOnlyWhenComplete', 'Read-only on Complete'],
        ].map(([key, label]) => (
          <label
            key={key}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={Boolean(workflow[key as keyof MhdFormWorkflowDefinition])}
              onChange={(event) => onChange({ ...workflow, [key]: event.target.checked })}
            />
            {label}
          </label>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Statuses
          </h3>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...workflow,
                statuses: [
                  ...workflow.statuses,
                  { id: nextId('status'), name: 'New Status', color: 'slate' },
                ],
              })
            }
            className="rounded-md border border-border px-3 py-2 text-sm font-medium"
          >
            Add Status
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {workflow.statuses.map((status) => (
            <div key={status.id} className="space-y-2 rounded-md border border-border bg-card p-3">
              <input
                aria-label="Status Name"
                value={status.name}
                onChange={(event) => updateStatus(status.id, { name: event.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
              <input
                aria-label="Status Color"
                value={status.color}
                onChange={(event) => updateStatus(status.id, { color: event.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
              <div className="flex gap-3 text-xs text-muted-foreground">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={Boolean(status.isInitial)}
                    onChange={(event) =>
                      updateStatus(status.id, { isInitial: event.target.checked })
                    }
                  />
                  Initial
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={Boolean(status.isTerminal)}
                    onChange={(event) =>
                      updateStatus(status.id, { isTerminal: event.target.checked })
                    }
                  />
                  Terminal
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Roles
          </h3>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...workflow,
                roles: [
                  ...workflow.roles,
                  { id: nextId('role'), name: 'New Role', type: 'INTERNAL' },
                ],
              })
            }
            className="rounded-md border border-border px-3 py-2 text-sm font-medium"
          >
            Add Role
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {workflow.roles.map((role) => (
            <div key={role.id} className="space-y-2 rounded-md border border-border bg-card p-3">
              <input
                aria-label="Role Name"
                value={role.name}
                onChange={(event) => updateRole(role.id, { name: event.target.value })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
              <select
                aria-label="Role Type"
                value={role.type}
                onChange={(event) =>
                  updateRole(role.id, {
                    type: event.target.value as MhdFormWorkflowRole['type'],
                  })
                }
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="PUBLIC">Public</option>
                <option value="INTERNAL">Internal</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Actions & Triggers
          </h3>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...workflow,
                actions: [
                  ...workflow.actions,
                  {
                    id: nextId('action'),
                    name: 'New Action',
                    allowedRoleIds: [],
                    triggerEvent: 'MANUAL',
                  },
                ],
              })
            }
            className="rounded-md border border-border px-3 py-2 text-sm font-medium"
          >
            Add Action
          </button>
        </div>
        <div className="space-y-3">
          {workflow.actions.map((action) => (
            <div
              key={action.id}
              className="grid gap-3 rounded-md border border-border bg-card p-3 md:grid-cols-4"
            >
              <input
                aria-label="Action Name"
                value={action.name}
                onChange={(event) => updateAction(action.id, { name: event.target.value })}
                className="rounded-md border border-border px-3 py-2 text-sm"
              />
              <select
                aria-label="Trigger Event"
                value={action.triggerEvent}
                onChange={(event) =>
                  updateAction(action.id, {
                    triggerEvent: event.target.value as MhdFormWorkflowAction['triggerEvent'],
                  })
                }
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                {triggerEvents.map((event) => (
                  <option key={event} value={event}>
                    {event.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
              <select
                aria-label="From Status"
                value={action.fromStatusId ?? ''}
                onChange={(event) =>
                  updateAction(action.id, { fromStatusId: event.target.value || undefined })
                }
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="">Any status</option>
                {workflow.statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="To Status"
                value={action.toStatusId ?? ''}
                onChange={(event) =>
                  updateAction(action.id, { toStatusId: event.target.value || undefined })
                }
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="">No status change</option>
                {workflow.statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              <input
                aria-label="Condition"
                value={action.condition ?? ''}
                onChange={(event) => updateAction(action.id, { condition: event.target.value })}
                placeholder="Condition"
                className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
              />
              <input
                aria-label="Webhook URL"
                value={action.webhookUrl ?? ''}
                onChange={(event) => updateAction(action.id, { webhookUrl: event.target.value })}
                placeholder="Webhook URL"
                className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(action.sendEmail)}
                  onChange={(event) => updateAction(action.id, { sendEmail: event.target.checked })}
                />
                Send Email
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(action.createTask)}
                  onChange={(event) =>
                    updateAction(action.id, { createTask: event.target.checked })
                  }
                />
                Create Task
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tasks & Reminders
          </h3>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...workflow,
                taskViews: [
                  ...workflow.taskViews,
                  { id: nextId('task'), name: 'New Task', reminderEnabled: false },
                ],
              })
            }
            className="rounded-md border border-border px-3 py-2 text-sm font-medium"
          >
            Add Task
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {workflow.taskViews.map((task) => (
            <div
              key={task.id}
              className="grid gap-2 rounded-md border border-border bg-card p-3 md:grid-cols-2"
            >
              <input
                aria-label="Task Name"
                value={task.name}
                onChange={(event) => updateTaskView(task.id, { name: event.target.value })}
                className="rounded-md border border-border px-3 py-2 text-sm md:col-span-2"
              />
              <select
                aria-label="Task Role"
                value={task.roleId ?? ''}
                onChange={(event) =>
                  updateTaskView(task.id, { roleId: event.target.value || undefined })
                }
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="">No role</option>
                {workflow.roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Task Status"
                value={task.statusId ?? ''}
                onChange={(event) =>
                  updateTaskView(task.id, { statusId: event.target.value || undefined })
                }
                className="rounded-md border border-border px-3 py-2 text-sm"
              >
                <option value="">Any status</option>
                {workflow.statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
              <input
                aria-label="Due In Days"
                type="number"
                value={task.dueInDays ?? ''}
                onChange={(event) =>
                  updateTaskView(task.id, {
                    dueInDays: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
                className="rounded-md border border-border px-3 py-2 text-sm"
              />
              <input
                aria-label="Reminder Offset Days"
                type="number"
                value={task.reminderOffsetDays ?? ''}
                onChange={(event) =>
                  updateTaskView(task.id, {
                    reminderOffsetDays: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
                className="rounded-md border border-border px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(task.reminderEnabled)}
                  onChange={(event) =>
                    updateTaskView(task.id, { reminderEnabled: event.target.checked })
                  }
                />
                Reminder Enabled
              </label>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
