import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdAccommodationDetail, MhdComplianceReadiness } from '../Types';

const { rolesRef, detailRef, readinessRef, implementMock, revealMock, recordMedicalMock } =
  vi.hoisted(() => ({
    rolesRef: { current: [] as MhdAuthRoleName[] },
    detailRef: { current: null as unknown },
    readinessRef: { current: null as unknown },
    implementMock: vi.fn(),
    revealMock: vi.fn(),
    recordMedicalMock: vi.fn(),
  }));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: rolesRef.current }),
}));

function mutation(mutateAsync: (input: never) => Promise<unknown>) {
  return { mutateAsync, isPending: false };
}

vi.mock('../Hook', () => ({
  useMhdAccommodationCase: () => ({ data: detailRef.current, isLoading: false }),
  useMhdAccommodationReadiness: () => ({ data: readinessRef.current }),
  useMhdAccommodationTransition: () => mutation(vi.fn()),
  useMhdAccommodationInteraction: () => mutation(vi.fn()),
  useMhdAccommodationOption: () => mutation(vi.fn()),
  useMhdAccommodationDecision: () => mutation(vi.fn()),
  useMhdAccommodationImplementation: () => mutation(implementMock),
  useMhdAccommodationReview: () => mutation(vi.fn()),
  useMhdAccommodationMedicalRecord: () => mutation(recordMedicalMock),
  useMhdAccommodationMedicalReveal: () => mutation(revealMock),
  // Added 2026-08-19 (option-catalog picker on this page's "Evaluate an
  // option" card) -- empty/not-loading is a safe default since no test in
  // this file exercises the catalog-picker path itself.
  useMhdAccommodationOptionCatalog: () => ({ data: [], isLoading: false, isError: false, error: null }),
}));

const { MhdAccommodationCaseDetailPage } =
  await import('../components/MhdAccommodationCaseDetailPage');

const OPTION_GOOD = {
  id: 'option-good',
  option_type: 'MODIFIED_SCHEDULE',
  description: 'Later start with a five-minute break each hour.',
  essential_function_ids: [],
  expected_effectiveness: 'Covers the full shift.',
  employee_preference: true,
  removes_essential_function: false,
  estimated_cost: null,
  disposition: 'SELECTED',
  disposition_reason: null,
};

const OPTION_REMOVES_ESSENTIAL = {
  ...OPTION_GOOD,
  id: 'option-removes-ef',
  option_type: 'JOB_RESTRUCTURING',
  description: 'Stop performing the cash-handling duty entirely.',
  removes_essential_function: true,
  disposition: 'REJECTED',
};

function detail(overrides: Partial<MhdAccommodationDetail> = {}): MhdAccommodationDetail {
  return {
    case: {
      id: 'case-1',
      reference_id: 'RA-0001',
      company_id: 'company-1',
      person_id: 'person-1',
      recruiting_application_id: null,
      leave_case_id: null,
      job_description_id: 'jd-1',
      essential_functions: [{ id: 'ef-1', text: 'Handle cash at the register.' }],
      request_source: 'SELF',
      request_channel: 'VERBAL',
      requested_at: '2026-07-25T17:00:00.000Z',
      request_summary: 'Asked for a seated workstation.',
      status: 'DECIDED',
      owner_user_id: null,
      closure_reason: null,
    },
    interactions: [
      {
        id: 'int-1',
        occurred_at: '2026-07-20T17:00:00.000Z',
        channel: 'MEETING',
        participants: [],
        summary: 'Discussed the schedule and the seated workstation.',
        next_step: null,
        next_step_due: null,
        employee_visible: true,
      },
    ],
    options: [OPTION_GOOD, OPTION_REMOVES_ESSENTIAL],
    decisions: [],
    implementations: [],
    reviews: [],
    medical_status: [],
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/accommodations/case-1']}>
      <Routes>
        <Route path="/accommodations/:caseId" element={<MhdAccommodationCaseDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  rolesRef.current = ['Platform Admin'];
  readinessRef.current = null;
  detailRef.current = detail();
});

/* ------------------------------------------------------------------ */
/* Implementation reads the DECIDED option, not local form state       */
/* ------------------------------------------------------------------ */

describe('implementation resolves the option from the active decision', () => {
  const activeDecision = {
    id: 'decision-1',
    outcome: 'APPROVED' as const,
    selected_option_id: OPTION_GOOD.id,
    denial_reason_code: null,
    decision_summary: 'Granted the later start.',
    alternatives_considered: [],
    interactive_process_continues: false,
    decided_at: '2026-07-24T17:00:00.000Z',
    superseded_at: null,
  };

  it('offers the decided option after a reload, with no local selection made', () => {
    // This is the reload case: `selectedOptionId` state is empty, so an
    // implementation panel driven by local state alone would never appear and
    // the granted accommodation could not be activated.
    detailRef.current = detail({ decisions: [activeDecision] });
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /implementation/i }));

    expect(screen.getByText('Implement selected option')).toBeInTheDocument();
    expect(screen.getByText(OPTION_GOOD.description)).toBeInTheDocument();
  });

  it('sends the decided option id to the implement RPC', () => {
    detailRef.current = detail({ decisions: [activeDecision] });
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /implementation/i }));
    fireEvent.change(screen.getByPlaceholderText(/Manager-safe implementation instruction/i), {
      target: { value: 'Start at 10:00; five-minute break each hour.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /activate accommodation/i }));

    expect(implementMock).toHaveBeenCalledWith(
      expect.objectContaining({ caseId: 'case-1', optionId: OPTION_GOOD.id }),
    );
  });

  it('ignores a SUPERSEDED decision — only the active one drives implementation', () => {
    detailRef.current = detail({
      decisions: [{ ...activeDecision, superseded_at: '2026-07-25T00:00:00.000Z' }],
    });
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /implementation/i }));
    expect(screen.queryByText('Implement selected option')).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Decision gate                                                        */
/* ------------------------------------------------------------------ */

describe('the decision gate is visible before it is enforced', () => {
  it('blocks and explains a decision recorded before any interaction', () => {
    detailRef.current = detail({ interactions: [] });
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /decision/i }));
    fireEvent.change(screen.getByPlaceholderText('Decision summary'), {
      target: { value: 'Granted.' },
    });

    expect(
      screen.getByText('Record at least one interactive-process interaction before deciding.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /record decision/i })).toBeDisabled();
  });

  it('marks an option that removes an essential function unselectable', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /decision/i }));

    const removing = screen.getByRole('option', {
      name: new RegExp(OPTION_REMOVES_ESSENTIAL.description, 'i'),
    }) as HTMLOptionElement;
    expect(removing.disabled).toBe(true);
  });

  it('requires an individualized analysis before a denial can be recorded', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /decision/i }));
    fireEvent.change(screen.getByDisplayValue('Approved'), { target: { value: 'DENIED' } });
    fireEvent.change(screen.getByPlaceholderText('Decision summary'), {
      target: { value: 'Not granted.' },
    });

    expect(
      screen.getByText(
        'A denial requires an individualized analysis recording the alternatives that were evaluated.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /record decision/i })).toBeDisabled();

    fireEvent.change(
      screen.getByPlaceholderText('Individualized analysis and alternatives considered'),
      { target: { value: 'Remote work and reassignment were costed and evaluated.' } },
    );
    expect(screen.getByRole('button', { name: /record decision/i })).not.toBeDisabled();
  });
});

/* ------------------------------------------------------------------ */
/* The medical partition, in the UI                                    */
/* ------------------------------------------------------------------ */

const MEDICAL_ROW = {
  id: 'doc-1',
  documentation_type: 'PROVIDER_NOTE',
  status: 'SUFFICIENT',
  need_is_obvious: false,
  documentation_requested: true,
  requested_at: '2026-07-20',
  due_date: '2026-08-04',
  received_at: '2026-07-28',
  has_attachment: true,
};

describe('the restricted medical surface is Platform Admin / HR Partner only', () => {
  it.each(['Platform Admin', 'HR Partner'] as MhdAuthRoleName[])(
    'renders the record-and-reveal surface for %s',
    (role) => {
      rolesRef.current = [role];
      detailRef.current = detail({ medical_status: [MEDICAL_ROW] });
      renderPage();

      fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));
      expect(screen.getByText('Record Restricted Medical Status')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reveal restricted record/i })).toBeInTheDocument();
    },
  );

  it('gives a Client Admin the workflow status but NO reveal and NO medical entry', () => {
    // A Client Admin administers the case and still cannot reach medical
    // content — the RPC refuses it with 42501, and the UI must not pretend
    // otherwise by rendering an affordance that always fails.
    rolesRef.current = ['Client Admin'];
    detailRef.current = detail({ medical_status: [MEDICAL_ROW] });
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));
    expect(
      screen.getByText(/Restricted medical content is unavailable to your role/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /reveal restricted record/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Record Restricted Medical Status')).not.toBeInTheDocument();
    // The non-medical status metadata still renders — the partition is surgical.
    expect(screen.getByText(/Provider Note/)).toBeInTheDocument();
  });

  it('gives a Client User no administrative surface at all', () => {
    rolesRef.current = ['Client User'];
    detailRef.current = detail({ medical_status: [MEDICAL_ROW] });
    renderPage();

    expect(screen.queryByText('Workflow status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));
    expect(
      screen.queryByRole('button', { name: /reveal restricted record/i }),
    ).not.toBeInTheDocument();
  });

  it('withdraws a documentation request the moment the need is marked obvious', () => {
    rolesRef.current = ['HR Partner'];
    detailRef.current = detail({ medical_status: [] });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));

    const requested = screen.getByLabelText(/Documentation requested/i);
    fireEvent.click(requested);
    expect(requested).toBeChecked();

    fireEvent.click(screen.getByLabelText(/Disability and need for accommodation are obvious/i));
    // Documentation cannot be requested for an obvious need, so the checkbox is
    // cleared and locked rather than merely warned about.
    expect(requested).not.toBeChecked();
    expect(requested).toBeDisabled();
  });

  it('records only the functional limitation and accommodation need', () => {
    rolesRef.current = ['HR Partner'];
    detailRef.current = detail({ medical_status: [] });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));

    fireEvent.change(screen.getByLabelText('Functional limitation'), {
      target: { value: 'Cannot stand longer than 20 minutes.' },
    });
    fireEvent.change(screen.getByLabelText('Accommodation need'), {
      target: { value: 'Seated workstation.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /record restricted status/i }));

    expect(recordMedicalMock).toHaveBeenCalledWith({
      caseId: 'case-1',
      documentationType: 'SIMPLE_CERTIFICATION',
      status: 'NOT_NEEDED',
      needIsObvious: false,
      documentationRequested: false,
      requestedAt: null,
      dueDate: null,
      functionalLimitation: 'Cannot stand longer than 20 minutes.',
      accommodationNeed: 'Seated workstation.',
    });
  });

  it('blocks recording prohibited medical detail before it can reach the database', () => {
    rolesRef.current = ['HR Partner'];
    detailRef.current = detail({ medical_status: [] });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));

    fireEvent.change(screen.getByLabelText('Functional limitation'), {
      target: { value: 'Her diagnosis is multiple sclerosis.' },
    });

    expect(screen.getByRole('button', { name: /record restricted status/i })).toBeDisabled();
    expect(recordMedicalMock).not.toHaveBeenCalled();
  });

  it('shows the two revealed fields only after an explicit, audited reveal', async () => {
    rolesRef.current = ['Platform Admin'];
    detailRef.current = detail({ medical_status: [MEDICAL_ROW] });
    revealMock.mockResolvedValue({
      functional_limitation: 'Cannot stand longer than 20 minutes.',
      accommodation_need: 'Seated workstation.',
    });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));

    // Nothing is revealed until the operator asks; the reveal is a mutation
    // precisely because it writes a SENSITIVE_FIELD_REVEAL audit event.
    expect(screen.queryByText('Cannot stand longer than 20 minutes.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reveal restricted record/i }));
    expect(await screen.findByText('Cannot stand longer than 20 minutes.')).toBeInTheDocument();
    expect(screen.getByText('Seated workstation.')).toBeInTheDocument();
    expect(revealMock).toHaveBeenCalledWith('doc-1');
  });
});

/* ------------------------------------------------------------------ */
/* Pre-live compliance gate                                            */
/* ------------------------------------------------------------------ */

describe('the pre-live compliance gate banner', () => {
  it('warns while regulated content still has pending blockers', () => {
    readinessRef.current = {
      module_key: 'ACCOMMODATIONS',
      release_ready: false,
      blocker_count: 3,
      blockers: [],
    } satisfies MhdComplianceReadiness;
    renderPage();

    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Pre-live compliance gate is active');
    expect(banner).toHaveTextContent('3 regulated content items');
    expect(banner).toHaveTextContent(/development and validation only/i);
  });

  it('singularizes a lone blocker', () => {
    readinessRef.current = {
      module_key: 'ACCOMMODATIONS',
      release_ready: false,
      blocker_count: 1,
      blockers: [],
    } satisfies MhdComplianceReadiness;
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('1 regulated content item ');
  });

  it('disappears only once the module is genuinely release-ready', () => {
    readinessRef.current = {
      module_key: 'ACCOMMODATIONS',
      release_ready: true,
      blocker_count: 0,
      blockers: [],
    } satisfies MhdComplianceReadiness;
    renderPage();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stays silent — never reassuring — when readiness is unknown', () => {
    readinessRef.current = null;
    renderPage();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
