import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const MANAGER_PERSON_ID = '3e8a1c47-5d29-4f60-b7a4-9c12d8e05f36';
const REPORT_WITH_ID = '8b41d6e2-0f73-4a95-8c1e-52a7b9d340f8';
const REPORT_WITHOUT_ID = 'c7d92a15-6e38-41b0-9f84-1a3c5e7d2b69';

const { directReportsRef, instructionsByPerson } = vi.hoisted(() => ({
  directReportsRef: { current: [] as Array<{ personId: string; displayName: string }> },
  instructionsByPerson: new Map<string, unknown[]>(),
}));

vi.mock('@/features/people/Hook', () => ({
  useMhdDirectReports: () => ({ data: directReportsRef.current }),
}));

vi.mock('../Hook', () => ({
  useMhdAccommodationManagerInstructions: (personId: string | null) => ({
    data: personId ? (instructionsByPerson.get(personId) ?? []) : [],
  }),
}));

const { MhdAccommodationTeamPanel } = await import('../components/MhdAccommodationTeamPanel');

beforeEach(() => {
  directReportsRef.current = [
    { personId: REPORT_WITH_ID, displayName: 'Priya Raman' },
    { personId: REPORT_WITHOUT_ID, displayName: 'Marcus Oyelaran' },
  ];
  instructionsByPerson.clear();
  instructionsByPerson.set(REPORT_WITH_ID, [
    {
      implementationId: 'impl-1',
      optionType: 'SCHEDULE_CHANGE',
      managerInstruction: 'Allow a 9:30 start; no meetings before 10:00.',
      startDate: '2026-09-01',
      endDate: null,
      reviewDueDate: '2026-12-01',
    },
  ]);
});

describe('MhdAccommodationTeamPanel', () => {
  it('shows only the instruction, its dates and the review date for a report with an active accommodation', () => {
    render(<MhdAccommodationTeamPanel managerPersonId={MANAGER_PERSON_ID} />);
    expect(screen.getByText('Priya Raman')).toBeInTheDocument();
    expect(screen.getByText('Allow a 9:30 start; no meetings before 10:00.')).toBeInTheDocument();
    expect(screen.getByText(/From 2026-09-01, ongoing/)).toBeInTheDocument();
    expect(screen.getByText(/Review due 2026-12-01/)).toBeInTheDocument();
  });

  it('never names a report who has no active instruction, so it cannot reveal that a case exists', () => {
    render(<MhdAccommodationTeamPanel managerPersonId={MANAGER_PERSON_ID} />);
    expect(screen.queryByText('Marcus Oyelaran')).not.toBeInTheDocument();
  });

  it('carries no medical vocabulary or reason for the accommodation', () => {
    const { container } = render(<MhdAccommodationTeamPanel managerPersonId={MANAGER_PERSON_ID} />);
    expect(container.textContent ?? '').not.toMatch(/diagnos|medical record|limitation|request source|option type/i);
    expect(container.textContent ?? '').not.toMatch(/SCHEDULE_CHANGE/);
  });

  it('renders nothing for someone with no direct reports', () => {
    directReportsRef.current = [];
    const { container } = render(<MhdAccommodationTeamPanel managerPersonId={MANAGER_PERSON_ID} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing without a signed-in person', () => {
    const { container } = render(<MhdAccommodationTeamPanel managerPersonId={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
