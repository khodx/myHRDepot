import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mhdFormatDate } from '@/utils/mhdDateFormat';
import { MhdLeaveDeadlineBadge } from '../components/MhdLeaveDeadlineBadge';
import type { MhdLeaveDeadline } from '../WorkflowTypes';

const base: MhdLeaveDeadline = {
  id: 'deadline-1',
  deadline_kind: 'LEAVE_CFRA_RESPONSE',
  basis_event: 'CASE_REQUEST',
  basis_at: '2026-08-03T15:00:00Z',
  due_at: '2026-08-10T15:00:00Z',
  satisfied_at: null,
  waived_at: null,
  waiver_reason: null,
  legal_citation: '2 CCR 11091',
  is_overdue: false,
};

describe('MhdLeaveDeadlineBadge', () => {
  it('labels the kind in words, keeps acronyms and shows the database due date', () => {
    render(<MhdLeaveDeadlineBadge deadline={base} />);
    expect(screen.getByText('CFRA Response')).toBeInTheDocument();
    expect(screen.getByText(`Due ${mhdFormatDate(base.due_at)}`)).toBeInTheDocument();
    expect(screen.getByText('Due')).toBeInTheDocument();
  });

  it('shows Overdue for an open deadline past due', () => {
    render(<MhdLeaveDeadlineBadge deadline={{ ...base, is_overdue: true }} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('shows Satisfied once closed, even if it had been overdue', () => {
    render(
      <MhdLeaveDeadlineBadge
        deadline={{ ...base, is_overdue: false, satisfied_at: '2026-08-07T12:00:00Z' }}
      />,
    );
    expect(screen.getByText('Satisfied')).toBeInTheDocument();
  });

  it('shows the waiver reason for a waived deadline', () => {
    render(
      <MhdLeaveDeadlineBadge
        deadline={{
          ...base,
          deadline_kind: 'LEAVE_CERT_DUE',
          waived_at: '2026-08-05T12:00:00Z',
          waiver_reason: 'Certification not required for this leave',
        }}
      />,
    );
    expect(screen.getByText('Cert Due')).toBeInTheDocument();
    expect(
      screen.getByText('Waived: Certification not required for this leave'),
    ).toBeInTheDocument();
  });
});
