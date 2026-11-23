import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/postgrest-js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdComplianceReadiness } from '@/types/mhdCompliance';
import type { MhdLeaveDeadline, MhdLeaveWorkflow } from '../WorkflowTypes';
import { mhdResetLeaveDraftService } from './leaveDraftTestKit';
import { mhdTestLeaveWorkflow } from './leaveWorkflowFixture';

const CASE_ID = crypto.randomUUID();

const { paySourceAsync, workflowData, readinessData } = vi.hoisted(() => ({
  paySourceAsync: vi.fn(),
  workflowData: { current: null as unknown },
  readinessData: { current: undefined as unknown },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    authUserId: 'f3a91c27-6b4e-4d08-9a15-7e2c0b8d4f63',
    profile: { companyId: '5d0e7a92-1c48-4b36-8f2d-a96b3e1c7d40' },
    roles: ['Employee'],
  }),
}));

vi.mock('@/features/documents/Service', () => ({
  mhdDocumentService: { listTemplates: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/features/drafts/Service', async () => ({
  mhdDraftService: (await import('./leaveDraftTestKit')).mhdLeaveDraftServiceMock,
}));

vi.mock('../WorkflowHook', async () => {
  const { mhdIdleLeaveWorkflowHooks } = await import('./leaveWorkflowFixture');
  return {
    ...mhdIdleLeaveWorkflowHooks(),
    useMhdLeaveWorkflow: () => ({ isLoading: false, data: workflowData.current }),
    useMhdLeaveReadiness: () => ({ data: readinessData.current }),
    useMhdLeavePaySource: () => ({ mutateAsync: paySourceAsync, isPending: false }),
  };
});

const { MhdLeaveWorkflowPanel } = await import('../components/MhdLeaveWorkflowPanel');

function deadline(overrides: Partial<MhdLeaveDeadline>): MhdLeaveDeadline {
  return {
    id: crypto.randomUUID(),
    deadline_kind: 'LEAVE_ELIGIBILITY_NOTICE',
    basis_event: 'CASE_REQUEST',
    basis_at: '2026-08-03T15:00:00Z',
    due_at: '2026-08-10T15:00:00Z',
    satisfied_at: null,
    waived_at: null,
    waiver_reason: null,
    legal_citation: '2 CCR 11091',
    is_overdue: false,
    ...overrides,
  };
}

function setWorkflow(overrides: Partial<MhdLeaveWorkflow> = {}) {
  workflowData.current = mhdTestLeaveWorkflow(CASE_ID, overrides, {
    workers_comp: null,
    key_employee: null,
  });
}

function renderPanel(privileged: boolean) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <MhdLeaveWorkflowPanel caseId={CASE_ID} privileged={privileged} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function openTab(name: RegExp) {
  fireEvent.click(screen.getByRole('tab', { name }));
}

beforeEach(() => {
  vi.clearAllMocks();
  mhdResetLeaveDraftService();
  readinessData.current = undefined;
  setWorkflow();
});

describe('MhdLeaveWorkflowPanel for the employee who owns the case', () => {
  it('renders the checklist and the legal deadlines with overdue and satisfied states', () => {
    setWorkflow({
      checklist: [
        {
          stage_no: 3,
          stage_key: 'NOTICES',
          item_key: 'ELIGIBILITY_NOTICE',
          label: 'Notice of eligibility and rights issued',
          status: 'OVERDUE',
          due_at: '2026-08-10T15:00:00Z',
        },
        {
          stage_no: 4,
          stage_key: 'CERTIFICATION',
          item_key: 'CERTIFICATION_REQUESTED',
          label: 'Certification received',
          status: 'DONE',
          due_at: null,
        },
      ],
      deadlines: [
        deadline({ deadline_kind: 'LEAVE_ELIGIBILITY_NOTICE', is_overdue: true }),
        deadline({ deadline_kind: 'LEAVE_CERT_DUE', satisfied_at: '2026-08-07T12:00:00Z' }),
      ],
    });
    renderPanel(false);
    openTab(/^Checklist/);

    expect(screen.getByText('Notice of eligibility and rights issued')).toBeInTheDocument();
    expect(screen.getByText('Certification received')).toBeInTheDocument();
    expect(screen.getAllByText('Overdue').length).toBeGreaterThan(0);
    expect(screen.getByText('Satisfied')).toBeInTheDocument();
  });

  it('offers no determination, notice, schedule or benefit controls', () => {
    setWorkflow({
      eligibility: [
        {
          id: crypto.randomUUID(),
          snapshot_id: crypto.randomUUID(),
          leave_type_id: crypto.randomUUID(),
          type_key: 'CFRA',
          evaluated_outcome: 'ELIGIBLE',
          effective_outcome: 'ELIGIBLE',
          findings: [],
          entitlement_hours: 480,
          override_reason: null,
          confirmed_at: null,
        },
      ],
    });
    renderPanel(false);
    expect(screen.queryByRole('button', { name: 'Confirm Determination' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Override' })).toBeNull();

    openTab(/^Notices/);
    expect(screen.queryByRole('button', { name: 'New Notice' })).toBeNull();
    openTab(/^Schedule/);
    expect(screen.queryByRole('button', { name: /record|add|change status/i })).toBeNull();
    openTab(/^Benefits/);
    expect(screen.queryByRole('button', { name: /record|add|change status/i })).toBeNull();
  });

  it('shows no pay-source form, and no key-employee or workers compensation form', () => {
    renderPanel(false);
    openTab(/^Pay/);
    expect(screen.queryByRole('button', { name: 'Add Pay Source' })).toBeNull();
    expect(screen.queryByLabelText('Pay source')).toBeNull();

    openTab(/^Controls/);
    expect(screen.getAllByText('Not Available')).toHaveLength(2);
    expect(screen.queryByLabelText('Key employee status')).toBeNull();
    expect(screen.queryByRole('button', { name: /claim/i })).toBeNull();
  });
});

describe('MhdLeaveWorkflowPanel pay refusals', () => {
  it('shows the rule-violation message the database raises for a required PTO', async () => {
    const refusal = new PostgrestError({
      message: 'Paid time off can be required only to run concurrently with an unpaid leave.',
      details: '',
      hint: '',
      code: '22023',
    });
    paySourceAsync.mockRejectedValue(refusal);
    renderPanel(true);
    openTab(/^Pay/);
    fireEvent.click(screen.getByRole('button', { name: 'Add Pay Source' }));

    fireEvent.change(screen.getByLabelText('Pay source'), { target: { value: 'PTO' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Pay Source' }));

    await waitFor(() => expect(paySourceAsync).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(refusal.message)).toBeInTheDocument();
  });
});

describe('MhdLeaveWorkflowPanel compliance gate', () => {
  it('shows the pending pre-live banner while the registry reports blockers', () => {
    readinessData.current = {
      module_key: 'LEAVES',
      release_ready: false,
      blocker_count: 4,
      blockers: [],
    } satisfies MhdComplianceReadiness;
    renderPanel(true);
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Pre-live compliance gate is active');
    expect(banner).toHaveTextContent('4 regulated content items');
  });

  it('shows no banner once the module is release-ready', () => {
    readinessData.current = {
      module_key: 'LEAVES',
      release_ready: true,
      blocker_count: 0,
      blockers: [],
    } satisfies MhdComplianceReadiness;
    renderPanel(true);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders the message of a not-approved-content refusal (55000)', async () => {
    const refusal = new PostgrestError({
      message: 'Compliance content ELIGIBILITY_NOTICE has not been approved for production.',
      details: '',
      hint: '',
      code: '55000',
    });
    paySourceAsync.mockRejectedValue(refusal);
    renderPanel(true);
    openTab(/^Pay/);
    fireEvent.click(screen.getByRole('button', { name: 'Add Pay Source' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record Pay Source' }));
    expect(await screen.findByText(refusal.message)).toBeInTheDocument();
  });
});
