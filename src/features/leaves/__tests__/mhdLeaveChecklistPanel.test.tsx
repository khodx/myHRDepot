import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mhdFormatDate } from '@/utils/mhdDateFormat';
import { MhdLeaveChecklistPanel } from '../components/MhdLeaveChecklistPanel';
import { MHD_LEAVE_CHECKLIST_STAGE_KEYS, type MhdLeaveChecklistItem } from '../WorkflowTypes';

const items: MhdLeaveChecklistItem[] = [
  {
    stage_no: 3,
    stage_key: 'NOTICES',
    item_key: 'ELIGIBILITY_NOTICE',
    label: 'Notice of eligibility and rights issued',
    status: 'OVERDUE',
    due_at: '2026-08-10T15:00:00Z',
  },
  {
    stage_no: 3,
    stage_key: 'NOTICES',
    item_key: 'EDD_FAMILY_LEAVE_PAMPHLET',
    label: 'EDD Paid Family Leave pamphlet provided',
    status: 'DONE',
    due_at: null,
  },
  {
    stage_no: 4,
    stage_key: 'CERTIFICATION',
    item_key: 'CERTIFICATION_REQUESTED',
    label: 'Medical certification requested',
    status: 'NOT_APPLICABLE',
    due_at: null,
  },
];

describe('MhdLeaveChecklistPanel', () => {
  it('renders one section per stage, in the database stage order', () => {
    render(<MhdLeaveChecklistPanel items={items} />);
    const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
    expect(headings).toEqual([
      'Request',
      'Eligibility',
      'Notices',
      'Certification',
      'Designation',
      'Tracking',
      'Pay Coordination',
      'Benefits',
      'Return To Work',
    ]);
    expect(headings).toHaveLength(MHD_LEAVE_CHECKLIST_STAGE_KEYS.length);
  });

  it('lists each item with its status and due date', () => {
    render(<MhdLeaveChecklistPanel items={items} />);
    const notices = screen.getByRole('list', { name: 'Notices Checklist' });
    expect(within(notices).getAllByRole('listitem')).toHaveLength(2);
    expect(within(notices).getByText('Overdue')).toBeInTheDocument();
    expect(within(notices).getByText('Done')).toBeInTheDocument();
    expect(
      within(notices).getByText(`Due ${mhdFormatDate('2026-08-10T15:00:00Z')}`),
    ).toBeInTheDocument();
    expect(screen.getByText('Not Applicable')).toBeInTheDocument();
  });

  it('says so when a stage, or the whole checklist, has no items', () => {
    render(<MhdLeaveChecklistPanel items={[]} />);
    expect(screen.getAllByText('No checklist items for this stage.')).toHaveLength(
      MHD_LEAVE_CHECKLIST_STAGE_KEYS.length,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
