import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MhdEditOccurrenceDialog } from '../components/MhdEditOccurrenceDialog';
import { MhdEndAssignmentDialog } from '../components/MhdEndAssignmentDialog';
import { MhdHolidayDialog } from '../components/MhdHolidayDialog';
import { MhdOverrideShiftDialog } from '../components/MhdOverrideShiftDialog';
import { MhdReassessmentQueuePanel } from '../components/MhdReassessmentQueuePanel';
import { MhdReclassifyOccurrenceDialog } from '../components/MhdReclassifyOccurrenceDialog';
import { MhdThresholdEventPanel } from '../components/MhdThresholdEventPanel';
import type {
  MhdAttendanceOccurrence,
  MhdReassessmentEvent,
  MhdScheduledShift,
  MhdThresholdEvent,
} from '../Types';

const occurrence: MhdAttendanceOccurrence = {
  id: 'occ-1',
  referenceId: 'OCCR-1',
  personId: 'person-1',
  personDisplayName: 'Imani Brooks',
  occurrenceDate: '2026-09-14',
  occurrenceType: 'ABSENCE',
  classification: 'UNEXCUSED',
  protectedLeaveCategory: null,
  minutesVariance: null,
  reasonNote: 'Called in sick',
  pointsAssessed: 1,
  voidedAt: null,
};

const protectedOccurrence: MhdAttendanceOccurrence = {
  ...occurrence,
  classification: 'PROTECTED',
  protectedLeaveCategory: 'CFRA',
  pointsAssessed: 0,
};

function threshold(overrides: Partial<MhdThresholdEvent> = {}): MhdThresholdEvent {
  return {
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
    ...overrides,
  };
}

describe('MhdReclassifyOccurrenceDialog', () => {
  it('refuses to submit without a reason', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdReclassifyOccurrenceDialog
        occurrence={occurrence}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('New classification'), {
      target: { value: 'EXCUSED_PAID' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reclassify' }));

    expect(await screen.findByText(/reason is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('refuses a no-op reclassification', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdReclassifyOccurrenceDialog
        occurrence={occurrence}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: 'No change.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reclassify' }));

    expect(await screen.findByText(/different classification/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('explains that moving INTO Protected unwinds points, and demands a category', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdReclassifyOccurrenceDialog
        occurrence={occurrence}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('New classification'), {
      target: { value: 'PROTECTED' },
    });
    expect(screen.getByText(/cannot accrue points under any policy setting/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: 'Certification received.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reclassify' }));
    expect(await screen.findByText(/requires a category/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Protected leave category'), {
      target: { value: 'CFRA' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Reclassify' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        occurrenceId: 'occ-1',
        classification: 'PROTECTED',
        protectedLeaveCategory: 'CFRA',
        reason: 'Certification received.',
      }),
    );
  });

  it('explains that moving OUT of Protected assesses nothing and queues a decision', () => {
    render(
      <MhdReclassifyOccurrenceDialog
        occurrence={protectedOccurrence}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('New classification'), {
      target: { value: 'UNEXCUSED' },
    });

    expect(screen.getByText(/No points are assessed automatically/i)).toBeInTheDocument();
    expect(screen.getByText(/reassessment item is queued/i)).toBeInTheDocument();
    // The category selector disappears once the occurrence is no longer protected.
    expect(screen.queryByLabelText('Protected leave category')).not.toBeInTheDocument();
  });
});

describe('MhdEditOccurrenceDialog', () => {
  it('sends only what changed, leaving the rest null so the server keeps the stored value', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdEditOccurrenceDialog
        occurrence={occurrence}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Minutes variance'), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        occurrenceId: 'occ-1',
        occurrenceType: null,
        minutesVariance: 20,
        reasonNote: null,
      }),
    );
  });

  it('never offers classification - that moves only through the reclassify dialog', () => {
    render(
      <MhdEditOccurrenceDialog
        occurrence={occurrence}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText(/classification/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Never record medical/i)).toBeInTheDocument();
  });
});

describe('MhdEndAssignmentDialog', () => {
  it('refuses an end date before the assignment started', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdEndAssignmentDialog
        assignmentId="asg-1"
        templateName="Front desk"
        effectiveFrom="2026-09-01"
        defaultDate="2026-08-15"
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'End Assignment' }));

    expect(await screen.findByText(/cannot be before the assignment started/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a valid end date', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdEndAssignmentDialog
        assignmentId="asg-1"
        templateName="Front desk"
        effectiveFrom="2026-09-01"
        defaultDate="2026-10-31"
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'End Assignment' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('asg-1', '2026-10-31'));
  });
});

describe('MhdOverrideShiftDialog', () => {
  const shift: MhdScheduledShift = {
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
  };

  it('prefills the stored times and refuses an override with no reason', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdOverrideShiftDialog
        shift={shift}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Start')).toHaveValue('09:00');
    expect(screen.getByLabelText('End')).toHaveValue('17:30');

    fireEvent.click(screen.getByRole('button', { name: 'Override Shift' }));
    expect(await screen.findByText(/override reason is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the new hours with the reason', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdOverrideShiftDialog
        shift={shift}
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '08:00' } });
    fireEvent.change(screen.getByLabelText(/Reason/), {
      target: { value: 'Covering a colleague.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Override Shift' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        shiftId: 'shift-1',
        startTime: '08:00',
        endTime: '17:30',
        unpaidBreakMinutes: 30,
        reason: 'Covering a colleague.',
      }),
    );
  });
});

describe('MhdHolidayDialog', () => {
  it('requires a holiday name', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdHolidayDialog
        companyId="company-1"
        defaultDate="2026-12-25"
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Save Holiday' }));

    expect(await screen.findByText(/holiday name is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('edits an existing holiday in place', async () => {
    const onSubmit = vi.fn();
    render(
      <MhdHolidayDialog
        companyId="company-1"
        holiday={{
          id: 'h1',
          holidayDate: '2026-11-26',
          holidayName: 'Thanksgiving Day',
          isPaid: true,
        }}
        defaultDate="2026-12-25"
        isSubmitting={false}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Edit Holiday' })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Paid holiday'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Holiday' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        holidayDate: '2026-11-26',
        holidayName: 'Thanksgiving Day',
        isPaid: false,
      }),
    );
  });
});

describe('MhdThresholdEventPanel', () => {
  const renderPanel = (props: Partial<React.ComponentProps<typeof MhdThresholdEventPanel>>) =>
    render(
      <MemoryRouter>
        <MhdThresholdEventPanel events={[threshold()]} onResolve={vi.fn()} {...props} />
      </MemoryRouter>,
    );

  it('offers Review, and Open Conduct Case only when the caller may open one', () => {
    const onOpenConduct = vi.fn().mockResolvedValue(undefined);
    renderPanel({ onOpenConduct });

    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Conduct Case' }));
    expect(onOpenConduct).toHaveBeenCalledWith('th-1');
  });

  it('does not offer Open Conduct Case when no handler is supplied', () => {
    renderPanel({});

    expect(screen.queryByRole('button', { name: 'Open Conduct Case' })).not.toBeInTheDocument();
  });

  it('is entirely read-only for HR Coordinator: no Review, no Conduct', () => {
    renderPanel({ readOnly: true, onOpenConduct: vi.fn() });

    expect(screen.getByText('Imani Brooks')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Review' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open Conduct Case' })).not.toBeInTheDocument();
  });

  it('links an actioned crossing to its Conduct case instead of offering to open another', () => {
    renderPanel({
      events: [
        threshold({
          status: 'ACTIONED',
          linkedConductCaseId: 'case-1',
          linkedConductCaseReference: 'C4F-2-0A1B-7-9D',
        }),
      ],
      onOpenConduct: vi.fn(),
    });

    const link = screen.getByRole('link', { name: 'Conduct case C4F-2-0A1B-7-9D' });
    expect(link).toHaveAttribute('href', '/conduct/case-1');
    expect(screen.queryByRole('button', { name: 'Open Conduct Case' })).not.toBeInTheDocument();
  });

  it('keeps requiring a reason to dismiss a threshold', async () => {
    const onResolve = vi.fn();
    renderPanel({ onResolve });

    fireEvent.click(screen.getByRole('button', { name: 'Review' }));
    fireEvent.change(screen.getByLabelText('Outcome'), { target: { value: 'DISMISSED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Outcome' }));

    expect(await screen.findByText(/requires a reason/i)).toBeInTheDocument();
    expect(onResolve).not.toHaveBeenCalled();
  });
});

describe('MhdReassessmentQueuePanel', () => {
  const event: MhdReassessmentEvent = {
    id: 're-1',
    personId: 'person-1',
    personDisplayName: 'Imani Brooks',
    occurrenceId: 'occ-1',
    occurrenceReference: 'OCCR-1',
    occurrenceDate: '2026-09-14',
    occurrenceType: 'ABSENCE',
    fromClassification: 'PROTECTED',
    toClassification: 'UNEXCUSED',
    raisedAt: '2026-09-20T00:00:00Z',
    status: 'RAISED',
    decisionNote: null,
    pointsAssessed: null,
    resolvedAt: null,
    projectedPoints: 1,
  };

  it('lets an authorised caller decide, and requires a reason either way', async () => {
    const onResolve = vi.fn();
    render(<MhdReassessmentQueuePanel events={[event]} onResolve={onResolve} />);

    fireEvent.click(screen.getByRole('button', { name: 'Do Not Assess' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record Decision' }));

    expect(await screen.findByText(/written reason is required either way/i)).toBeInTheDocument();
    expect(onResolve).not.toHaveBeenCalled();
  });

  it('shows the queue to HR Coordinator without any decision controls', () => {
    render(<MhdReassessmentQueuePanel events={[event]} readOnly onResolve={vi.fn()} />);

    expect(screen.getByText('Imani Brooks')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Assess Points' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Do Not Assess' })).not.toBeInTheDocument();
  });
});
