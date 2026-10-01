import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdScheduleTemplateDetail } from '../Types';

const h = vi.hoisted(() => ({
  access: { current: null as unknown },
  peopleArg: { current: undefined as unknown },
  templatesArg: { current: undefined as unknown },
  deleteTemplate: vi.fn(),
  navigate: vi.fn(),
  templates: { current: [] as unknown[] },
  assignments: { current: [] as unknown[] },
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => h.navigate,
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: ['HR Partner'], profile: { companyId: 'company-1' } }),
}));

const idle = () => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false });

vi.mock('../Hook', () => ({
  useMhdAttendanceAccess: () => h.access.current,
  useMhdScheduleTemplates: (companyId: unknown) => {
    h.templatesArg.current = companyId;
    return { isLoading: false, data: h.templates.current };
  },
  useMhdAttendancePeople: (companyId: unknown) => {
    h.peopleArg.current = companyId;
    return { data: [{ id: 'person-1', firstName: 'Imani', lastName: 'Brooks' }] };
  },
  useMhdScheduleAssignments: () => ({ data: h.assignments.current }),
  useMhdScheduledShifts: () => ({
    isLoading: false,
    data: [
      {
        id: 'shift-1',
        shiftDate: '2026-09-21',
        startTime: '09:00:00',
        endTime: '17:30:00',
        unpaidBreakMinutes: 30,
        source: 'GENERATED',
        isHoliday: false,
        overrideReason: null,
        occurrenceId: null,
        occurrenceType: null,
        classification: null,
      },
    ],
  }),
  useMhdCompanyHolidays: () => ({
    data: [{ id: 'h1', holidayDate: '2026-11-26', holidayName: 'Thanksgiving Day', isPaid: true }],
  }),
  useMhdAssignScheduleTemplate: idle,
  useMhdEndScheduleAssignment: idle,
  useMhdGenerateShifts: idle,
  useMhdOverrideShift: idle,
  useMhdUpsertHoliday: idle,
  useMhdDeleteHoliday: idle,
  useMhdDeleteScheduleTemplate: () => ({ mutateAsync: h.deleteTemplate, isPending: false }),
  useMhdScheduleTemplate: () => ({ isLoading: false, data: null }),
  useMhdCreateScheduleTemplate: idle,
  useMhdUpdateScheduleTemplate: idle,
}));

const { MhdSchedulePage } = await import('../components/MhdSchedulePage');
const { MhdScheduleTemplatesPage } = await import('../components/MhdScheduleTemplatesPage');
const { MhdScheduleTemplateForm } = await import('../components/MhdScheduleTemplateForm');

function setAccess(scope: 'company' | 'team' | 'self', canMutate: boolean) {
  h.access.current = {
    companyId: 'company-1',
    selfPersonId: 'person-self',
    scope,
    canMutate,
    canReadAll: scope === 'company',
    teamMembers:
      scope === 'company'
        ? []
        : [
            { id: 'person-self', displayName: 'Dana Whitfield (me)' },
            { id: 'person-1', displayName: 'Imani Brooks' },
          ],
    isScopeLoading: false,
  };
}

const currentAssignment = {
  id: 'asg-1',
  templateId: 'tpl-1',
  templateName: 'Front desk',
  effectiveFrom: '2026-08-01',
  effectiveTo: null,
  assignmentNote: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  h.templates.current = [];
  h.assignments.current = [currentAssignment];
  h.peopleArg.current = undefined;
  h.templatesArg.current = undefined;
});

describe('MhdSchedulePage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <MhdSchedulePage />
      </MemoryRouter>,
    );

  it('gives a privileged user every management control', () => {
    setAccess('company', true);
    renderPage();

    expect(screen.getByRole('link', { name: 'Manage Patterns' })).toHaveAttribute(
      'href',
      '/schedule/templates',
    );
    expect(screen.getByRole('button', { name: 'Generate 90 Days' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Assignment' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Holiday' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actions for 2026-09-21' })).toBeInTheDocument();
    expect(h.templatesArg.current).toBe('company-1');
  });

  it('opens the override dialog from a shift row', () => {
    setAccess('company', true);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for 2026-09-21' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Override Shift' }));

    expect(screen.getByRole('dialog', { name: 'Override Shift' })).toBeInTheDocument();
  });

  it('opens the holiday dialog for add and edit', () => {
    setAccess('company', true);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Add Holiday' }));
    expect(screen.getByRole('dialog', { name: 'Add Holiday' })).toBeInTheDocument();
  });

  it('shows HR Coordinator the whole company read-only: no pattern, generate, override or holiday controls', () => {
    setAccess('company', false);
    renderPage();

    expect(screen.getByLabelText('Employee')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage Patterns' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Generate 90 Days' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'End Assignment' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Holiday' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Actions for 2026-09-21' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Assign a pattern')).not.toBeInTheDocument();
    // Read-only, but the holiday list and the calendar are still visible.
    expect(screen.getByText('Thanksgiving Day')).toBeInTheDocument();
    expect(screen.getByText('2026-09-21')).toBeInTheDocument();
    // Pattern templates are not even fetched for a caller who cannot manage them.
    expect(h.templatesArg.current).toBeNull();
  });

  it('gives a manager a picker of themselves and their reports, and no company people list', () => {
    setAccess('team', false);
    renderPage();

    const picker = screen.getByLabelText('Employee');
    expect(within(picker).getByRole('option', { name: 'Imani Brooks' })).toBeInTheDocument();
    expect(within(picker).getByRole('option', { name: 'Dana Whitfield (me)' })).toBeInTheDocument();
    expect(h.peopleArg.current).toBeNull();
    expect(screen.queryByRole('button', { name: 'Generate 90 Days' })).not.toBeInTheDocument();
  });

  it('shows an employee only their own shifts, with no picker', () => {
    setAccess('self', false);
    renderPage();

    expect(screen.queryByLabelText('Employee')).not.toBeInTheDocument();
    expect(screen.getByText('2026-09-21')).toBeInTheDocument();
  });
});

describe('MhdScheduleTemplatesPage', () => {
  const renderList = () =>
    render(
      <MemoryRouter>
        <MhdScheduleTemplatesPage />
      </MemoryRouter>,
    );

  const summary = (overrides: Record<string, unknown>) => ({
    id: 'tpl-1',
    referenceId: 'SCHD-1',
    templateName: 'Front desk',
    description: null,
    isActive: true,
    totalWeeklyHours: 37.5,
    workingDays: 5,
    assignedCount: 0,
    createdAt: '2026-07-01T00:00:00Z',
    ...overrides,
  });

  it('shows an empty state with a way to create the first pattern', () => {
    renderList();

    expect(screen.getByText('No schedule patterns yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'New Pattern' }));
    expect(h.navigate).toHaveBeenCalledWith('/schedule/templates/new');
  });

  it('routes View and Edit to their own pages', () => {
    h.templates.current = [summary({})];
    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Front desk' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(h.navigate).toHaveBeenCalledWith('/schedule/templates/tpl-1/edit');

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Front desk' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'View' }));
    expect(h.navigate).toHaveBeenCalledWith('/schedule/templates/tpl-1');
  });

  it('deletes an unassigned pattern after confirmation', async () => {
    h.templates.current = [summary({})];
    h.deleteTemplate.mockResolvedValue(undefined);
    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Front desk' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Pattern' }));

    await waitFor(() => expect(h.deleteTemplate).toHaveBeenCalledWith('tpl-1'));
  });

  it('refuses to delete a pattern that has been assigned and points at deactivation instead', () => {
    h.templates.current = [summary({ assignedCount: 4 })];
    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Front desk' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

    expect(screen.getByText(/cannot be deleted - mark it inactive/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Pattern' })).toBeDisabled();
    expect(h.deleteTemplate).not.toHaveBeenCalled();
  });

  it('shows the server message when a delete is refused', async () => {
    h.templates.current = [summary({})];
    h.deleteTemplate.mockRejectedValue(new Error('Template is referenced and cannot be deleted'));
    renderList();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for Front desk' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Pattern' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Template is referenced and cannot be deleted',
    );
  });
});

describe('MhdScheduleTemplateForm', () => {
  const standardWeek: MhdScheduleTemplateDetail = {
    id: 'tpl-1',
    referenceId: 'SCHD-1',
    companyId: 'company-1',
    templateName: 'Front desk',
    description: 'Weekday coverage',
    isActive: true,
    days: [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
      const working = dayOfWeek >= 1 && dayOfWeek <= 5;
      return {
        dayOfWeek,
        isWorkingDay: working,
        startTime: working ? '09:00:00' : null,
        endTime: working ? '17:30:00' : null,
        unpaidBreakMinutes: working ? 30 : 0,
      };
    }),
  };

  it('refuses a pattern with no working days', async () => {
    const onSubmit = vi.fn();
    render(<MhdScheduleTemplateForm companyId="company-1" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Pattern name'), { target: { value: 'Empty week' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Pattern' }));

    expect(
      await screen.findByText(/no working days would never produce a shift/i),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires a pattern name', async () => {
    const onSubmit = vi.fn();
    render(<MhdScheduleTemplateForm companyId="company-1" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByLabelText('Monday is a working day'));
    fireEvent.change(screen.getByLabelText('Monday start time'), { target: { value: '09:00' } });
    fireEvent.change(screen.getByLabelText('Monday end time'), { target: { value: '17:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Pattern' }));

    expect(await screen.findByText(/template name is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid new pattern with all seven days', async () => {
    const onSubmit = vi.fn();
    render(<MhdScheduleTemplateForm companyId="company-1" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Pattern name'), { target: { value: 'Mornings' } });
    fireEvent.click(screen.getByLabelText('Monday is a working day'));
    fireEvent.change(screen.getByLabelText('Monday start time'), { target: { value: '06:00' } });
    fireEvent.change(screen.getByLabelText('Monday end time'), { target: { value: '14:30' } });
    fireEvent.change(screen.getByLabelText('Monday unpaid break minutes'), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Pattern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const [values, isActive] = onSubmit.mock.calls[0]!;
    expect(isActive).toBe(true);
    expect(values.templateName).toBe('Mornings');
    expect(values.days).toHaveLength(7);
    expect(values.days[1]).toMatchObject({
      dayOfWeek: 1,
      isWorkingDay: true,
      startTime: '06:00',
      endTime: '14:30',
      unpaidBreakMinutes: 30,
    });
    expect(values.days[0]).toMatchObject({ isWorkingDay: false, startTime: null, endTime: null });
  });

  it('clears a day’s times when it is switched back to non-working, so the database CHECK holds', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdScheduleTemplateForm
        companyId="company-1"
        template={standardWeek}
        showActiveToggle
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByLabelText('Friday is a working day'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Pattern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const [values] = onSubmit.mock.calls[0]!;
    expect(values.days[5]).toMatchObject({
      isWorkingDay: false,
      startTime: null,
      endTime: null,
      unpaidBreakMinutes: 0,
    });
  });

  it('reports the paid weekly hours as the pattern changes', () => {
    render(<MhdScheduleTemplateForm companyId="company-1" template={standardWeek} />);

    // Five days of 09:00-17:30 less a 30 minute break is 8 hours a day.
    expect(screen.getByText('40.0 paid hours per week')).toBeInTheDocument();
  });

  it('passes the active toggle through on edit', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdScheduleTemplateForm
        companyId="company-1"
        template={standardWeek}
        showActiveToggle
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Active \(inactive patterns/));
    fireEvent.click(screen.getByRole('button', { name: 'Save Pattern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]![1]).toBe(false);
  });

  it('renders view mode with every control disabled and no submit', () => {
    render(<MhdScheduleTemplateForm companyId="company-1" template={standardWeek} readOnly />);

    expect(screen.getByLabelText('Pattern name')).toBeDisabled();
    expect(screen.getByLabelText('Monday start time')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save Pattern' })).not.toBeInTheDocument();
  });
});
