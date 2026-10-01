import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

type Scope = 'company' | 'team' | 'self';

const h = vi.hoisted(() => ({
  access: { current: null as unknown },
  roles: { current: [] as string[] },
  occurrenceFilters: [] as unknown[],
  peopleArg: { current: undefined as unknown },
  thresholdArg: { current: undefined as unknown },
  reassessmentArg: { current: undefined as unknown },
  openConduct: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: h.roles.current, profile: { companyId: 'company-1' } }),
}));

const idleMutation = () => ({
  mutateAsync: vi.fn().mockResolvedValue(undefined),
  isPending: false,
});

vi.mock('../Hook', () => ({
  useMhdAttendanceAccess: () => h.access.current,
  useMhdAttendanceOccurrences: (filters: unknown) => {
    h.occurrenceFilters.push(filters);
    return {
      isLoading: false,
      data: [
        {
          id: 'occ-1',
          referenceId: 'OCCR-1',
          personId: 'person-1',
          personDisplayName: 'Imani Brooks',
          occurrenceDate: '2026-09-14',
          occurrenceType: 'ABSENCE',
          classification: 'UNEXCUSED',
          protectedLeaveCategory: null,
          minutesVariance: null,
          reasonNote: null,
          pointsAssessed: 1,
          voidedAt: null,
        },
      ],
    };
  },
  useMhdAttendancePolicy: () => ({ data: null }),
  useMhdAttendancePeople: (companyId: unknown) => {
    h.peopleArg.current = companyId;
    return { data: [{ id: 'person-1', firstName: 'Imani', lastName: 'Brooks' }] };
  },
  useMhdThresholdEvents: (companyId: unknown) => {
    h.thresholdArg.current = companyId;
    return {
      isLoading: false,
      data: [
        {
          id: 'th-1',
          personId: 'person-1',
          personDisplayName: 'Imani Brooks',
          actionLevel: 'WRITTEN_WARNING',
          pointsAt: 6,
          pointsAtCrossing: 6,
          crossedAt: '2026-09-15T00:00:00Z',
          status: 'RAISED',
          resolutionNote: null,
          linkedTaskId: null,
          linkedConductCaseId: null,
          linkedConductCaseReference: null,
        },
      ],
    };
  },
  useMhdReassessmentEvents: (companyId: unknown) => {
    h.reassessmentArg.current = companyId;
    return { isLoading: false, data: [] };
  },
  useMhdPointBalance: () => ({ data: 0, isLoading: false }),
  useMhdPointLedger: () => ({ data: [], isLoading: false }),
  useMhdRecordOccurrence: idleMutation,
  useMhdUpdateOccurrence: idleMutation,
  useMhdReclassifyOccurrence: idleMutation,
  useMhdVoidOccurrence: idleMutation,
  useMhdResolveThresholdEvent: idleMutation,
  useMhdResolveReassessmentEvent: idleMutation,
  useMhdAdjustPoints: idleMutation,
  useMhdOpenConductCaseFromThreshold: () => ({ mutateAsync: h.openConduct, isPending: false }),
}));

const { MhdAttendancePage } = await import('../components/MhdAttendancePage');

function setAccess(
  scope: Scope,
  roles: MhdAuthRoleName[],
  overrides: Record<string, unknown> = {},
) {
  const canReadAll = scope === 'company';
  h.roles.current = roles;
  h.access.current = {
    companyId: 'company-1',
    selfPersonId: 'person-self',
    scope,
    canMutate: scope === 'company' && !roles.includes('HR Coordinator'),
    canReadAll,
    teamMembers:
      scope === 'company'
        ? []
        : [
            { id: 'person-self', displayName: 'Dana Whitfield (me)' },
            { id: 'person-1', displayName: 'Imani Brooks' },
          ],
    isScopeLoading: false,
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MhdAttendancePage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  h.occurrenceFilters.length = 0;
  h.peopleArg.current = undefined;
  h.thresholdArg.current = undefined;
  h.reassessmentArg.current = undefined;
});

describe('MhdAttendancePage - privileged (HR Partner)', () => {
  beforeEach(() => setAccess('company', ['HR Partner']));

  it('offers recording, the discipline queues and the policy editor', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Record Occurrence' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Attendance Policy' })).toHaveAttribute(
      'href',
      '/attendance/policy',
    );
    expect(screen.getByRole('tab', { name: /Threshold Reviews/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Reassessments/ })).toBeInTheDocument();
    expect(h.thresholdArg.current).toBe('company-1');
    expect(h.reassessmentArg.current).toBe('company-1');
  });

  it('puts Edit, Reclassify and Void on every live occurrence', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for OCCR-1' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Reclassify' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Void' })).toBeInTheDocument();
  });

  it('opens the reclassify dialog from the row menu', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Actions for OCCR-1' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reclassify' }));

    expect(screen.getByRole('dialog', { name: 'Reclassify Occurrence' })).toBeInTheDocument();
  });

  it('offers Open Conduct Case on a raised threshold only to a role that may open one', () => {
    h.roles.current = ['HR Partner'];
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /Threshold Reviews/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Open Conduct Case' }));
    expect(h.openConduct).toHaveBeenCalledWith('th-1');
  });
});

describe('MhdAttendancePage - HR Coordinator (read-only, company-wide)', () => {
  beforeEach(() => setAccess('company', ['HR Coordinator']));

  it('reads the whole company and both queues but is offered no mutation', () => {
    renderPage();

    expect(screen.queryByRole('button', { name: 'Record Occurrence' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for OCCR-1' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Attendance Policy' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Threshold Reviews/ })).toBeInTheDocument();
    expect(h.thresholdArg.current).toBe('company-1');
  });

  it('shows the threshold queue without Review or Open Conduct Case controls', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /Threshold Reviews/ }));

    expect(screen.getByText('Imani Brooks')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Review' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Conduct Case' })).not.toBeInTheDocument();
  });
});

describe('MhdAttendancePage - manager (direct reports)', () => {
  beforeEach(() => setAccess('team', ['Manager']));

  it('shows the team picker and never requests or renders the discipline queues', () => {
    renderPage();

    expect(screen.getByRole('option', { name: 'My team' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Imani Brooks' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Threshold Reviews/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Reassessments/ })).not.toBeInTheDocument();
    // The hooks are handed null, so no discipline query is ever issued for a manager.
    expect(h.thresholdArg.current).toBeNull();
    expect(h.reassessmentArg.current).toBeNull();
    // Nor does a manager pull the whole company's people list.
    expect(h.peopleArg.current).toBeNull();
  });

  it('starts on the whole visible team rather than pinning to one person', () => {
    renderPage();

    expect(h.occurrenceFilters[0]).toMatchObject({ companyId: 'company-1', personId: null });
  });

  it('offers no recording, editing or voiding', () => {
    renderPage();

    expect(screen.queryByRole('button', { name: 'Record Occurrence' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for OCCR-1' })).not.toBeInTheDocument();
  });
});

describe('MhdAttendancePage - employee (own record)', () => {
  beforeEach(() => setAccess('self', ['Employee']));

  it('is pinned to the caller and shows no filters, queues or mutation', () => {
    renderPage();

    expect(h.occurrenceFilters[0]).toMatchObject({ personId: 'person-self' });
    expect(screen.queryByText('Employee')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record Occurrence' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Attendance Policy' })).toBeInTheDocument();
    expect(h.thresholdArg.current).toBeNull();
  });
});

describe('MhdAttendancePage - loading', () => {
  it('waits for a manager scope to resolve instead of flashing the wrong view', () => {
    setAccess('self', ['Manager'], { isScopeLoading: true });
    renderPage();

    expect(screen.getByText('Loading attendance…')).toBeInTheDocument();
    expect(h.occurrenceFilters).toHaveLength(0);
  });
});
