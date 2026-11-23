import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import {
  MHD_ACCOMMODATION_DENIAL_REASON_RULES,
  MHD_ACCOMMODATION_DENIAL_REASONS,
  MHD_ACCOMMODATION_OPTION_TYPES,
  mhdFormatAccommodationValue,
  type MhdAccommodationDenialReasonCode,
  type MhdAccommodationDetail,
  type MhdAccommodationProviderCertification,
  type MhdComplianceReadiness,
} from '../Types';

const {
  rolesRef,
  detailRef,
  readinessRef,
  implementMock,
  revealMock,
  recordMedicalMock,
  addOptionMock,
  reviewMock,
  interactionMock,
  decideMock,
  equipmentMock,
  providerRevealMock,
  profileRef,
  denialCodesRef,
  mockDraft,
  draftOptionsLog,
} = vi.hoisted(() => ({
  mockDraft: {
    draft: null as unknown,
    isLoading: false,
    isSaving: false,
    savedAt: null as string | null,
    saveError: null as string | null,
    save: vi.fn(),
    discard: vi.fn(),
  },
  draftOptionsLog: [] as { draftKind: string; draftKey: string; companyId?: string | null }[],
  rolesRef: { current: [] as MhdAuthRoleName[] },
  profileRef: { current: null as { companyId: string; personId: string | null } | null },
  denialCodesRef: { current: [] as unknown[] },
  decideMock: vi.fn(),
  equipmentMock: vi.fn(),
  providerRevealMock: vi.fn(),
  detailRef: { current: null as unknown },
  readinessRef: { current: null as unknown },
  implementMock: vi.fn(),
  revealMock: vi.fn(),
  recordMedicalMock: vi.fn(),
  addOptionMock: vi.fn(),
  reviewMock: vi.fn(),
  interactionMock: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ roles: rolesRef.current, profile: profileRef.current }),
}));

vi.mock('@/features/tasks/Service', () => ({
  mhdTaskService: { listAssignableUsers: vi.fn().mockResolvedValue([]) },
}));

vi.mock('@/features/drafts/Hook', () => ({
  useMhdDraft: (options: { draftKind: string; draftKey: string; companyId?: string | null }) => {
    draftOptionsLog.push(options);
    return mockDraft;
  },
}));

function mutation(mutateAsync: (input: never) => Promise<unknown>) {
  return { mutateAsync, isPending: false };
}

vi.mock('../Hook', () => ({
  useMhdAccommodationCase: () => ({ data: detailRef.current, isLoading: false }),
  useMhdAccommodationReadiness: () => ({ data: readinessRef.current }),
  useMhdAccommodationTransition: () => mutation(vi.fn()),
  useMhdAccommodationInteraction: () => mutation(interactionMock),
  useMhdAccommodationOption: () => mutation(addOptionMock),
  useMhdAccommodationDecision: () => mutation(decideMock),
  useMhdAccommodationRequestDetails: () => mutation(vi.fn()),
  useMhdAccommodationEmployeeCertify: () => mutation(vi.fn()),
  useMhdAccommodationProviderCertification: () => mutation(vi.fn()),
  useMhdAccommodationProviderCertificationReveal: () => ({
    ...mutation(providerRevealMock),
    reset: vi.fn(),
  }),
  useMhdAccommodationEquipment: () => mutation(equipmentMock),
  useMhdAccommodationDenialReasonCodes: () => ({ data: denialCodesRef.current }),
  useMhdAccommodationImplementation: () => mutation(implementMock),
  useMhdAccommodationReview: () => mutation(reviewMock),
  useMhdAccommodationMedicalRecord: () => mutation(recordMedicalMock),
  useMhdAccommodationMedicalReveal: () => mutation(revealMock),
  // Added 2026-08-19 (option-catalog picker on this page's "Evaluate an
  // option" card) -- empty/not-loading is a safe default since no test in
  // this file exercises the catalog-picker path itself.
  useMhdAccommodationOptionCatalog: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
  // Added 2026-08-22 (document-templates list on this page's "Evaluate an
  // option" card) -- empty/not-loading is a safe default since no test in
  // this file exercises the document-templates path itself.
  useMhdAccommodationDocumentTemplates: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
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
    request_details: null,
    provider_certification: null,
    ...overrides,
  };
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/accommodations/case-1']}>
        <Routes>
          <Route path="/accommodations/:caseId" element={<MhdAccommodationCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function withStatus(status: MhdAccommodationDetail['case']['status']): MhdAccommodationDetail {
  const base = detail();
  return { ...base, case: { ...base.case, status } };
}

/** Every input form opens in a modal from an action button; this opens one and returns the dialog. */
function openForm(launcher: string | RegExp) {
  fireEvent.click(screen.getByRole('button', { name: launcher }));
  return screen.getByRole('dialog');
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDraft.draft = null;
  mockDraft.save.mockResolvedValue(undefined);
  mockDraft.discard.mockResolvedValue(undefined);
  draftOptionsLog.length = 0;
  rolesRef.current = ['Platform Admin'];
  profileRef.current = null;
  denialCodesRef.current = [];
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
    denial_reasons: [],
    decision_summary: 'Granted the later start.',
    alternatives_considered: true,
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

    expect(screen.getByRole('button', { name: 'Implement Accommodation' })).toBeInTheDocument();
    expect(screen.getByText(OPTION_GOOD.description)).toBeInTheDocument();
    const dialog = openForm('Implement Accommodation');
    expect(within(dialog).getByText('Implement Selected Option')).toBeInTheDocument();
  });

  it('sends the decided option id to the implement RPC', async () => {
    detailRef.current = detail({ decisions: [activeDecision] });
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /implementation/i }));
    openForm('Implement Accommodation');
    fireEvent.change(screen.getByPlaceholderText(/Manager-safe implementation instruction/i), {
      target: { value: 'Start at 10:00; five-minute break each hour.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /activate accommodation/i }));

    await waitFor(() =>
      expect(implementMock).toHaveBeenCalledWith(
        expect.objectContaining({ caseId: 'case-1', optionId: OPTION_GOOD.id }),
      ),
    );
  });

  it('ignores a SUPERSEDED decision — only the active one drives implementation', () => {
    detailRef.current = detail({
      decisions: [{ ...activeDecision, superseded_at: '2026-07-25T00:00:00.000Z' }],
    });
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /implementation/i }));
    expect(
      screen.queryByRole('button', { name: 'Implement Accommodation' }),
    ).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Decision gate                                                        */
/* ------------------------------------------------------------------ */

describe('the decision gate is visible before it is enforced', () => {
  beforeEach(() => {
    // A decision can be recorded only from EVALUATION (mhd_accommodation_transition graph).
    detailRef.current = withStatus('EVALUATION');
  });

  it('blocks and explains a decision recorded before any interaction', () => {
    detailRef.current = { ...withStatus('EVALUATION'), interactions: [] };
    renderPage();

    fireEvent.click(screen.getByRole('tab', { name: /decision/i }));
    openForm('Decide Request');
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
    openForm('Decide Request');

    const removing = screen.getByRole('option', {
      name: new RegExp(OPTION_REMOVES_ESSENTIAL.description, 'i'),
    }) as HTMLOptionElement;
    expect(removing.disabled).toBe(true);
  });

  it('requires an individualized analysis before a denial can be recorded', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /decision/i }));
    openForm('Decide Request');
    fireEvent.change(screen.getByDisplayValue('Approved'), { target: { value: 'DENIED' } });
    fireEvent.change(screen.getByPlaceholderText('Decision summary'), {
      target: { value: 'Not granted.' },
    });
    // A denial now also needs at least one reason; choose one that needs no specifics so this
    // test isolates the individualized-analysis rule.
    fireEvent.click(screen.getByLabelText('Ineffective'));

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
/* Pickers offer only values the database accepts                      */
/* ------------------------------------------------------------------ */

describe('option and denial pickers match the database vocabulary', () => {
  it('offers exactly the allowed option types, never a legacy value', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /option/i }));
    openForm('Evaluate An Option');

    const picker = screen.getByDisplayValue('Job Restructuring') as HTMLSelectElement;
    const values = [...picker.options].map((option) => option.value);
    expect(values).toEqual([...MHD_ACCOMMODATION_OPTION_TYPES]);
    for (const rejected of ['MODIFIED_SCHEDULE', 'ACCESSIBILITY', 'REMOTE_WORK']) {
      expect(values).not.toContain(rejected);
    }
  });

  it('offers exactly the allowed denial reasons, never NO_REASONABLE_OPTION', () => {
    // The single denial select became combinable checkboxes (one per reason). While the
    // vocabulary query is loading the field falls back to the validation constant.
    detailRef.current = withStatus('EVALUATION');
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /decision/i }));
    openForm('Decide Request');
    fireEvent.change(screen.getByDisplayValue('Approved'), { target: { value: 'DENIED' } });

    const reasons = within(
      screen.getByRole('group', { name: 'Reasons For The Denial' }),
    ).getAllByRole('checkbox');
    const labels = reasons.map((checkbox) => checkbox.closest('label')?.textContent);
    expect(labels).toEqual(MHD_ACCOMMODATION_DENIAL_REASONS.map(mhdFormatAccommodationValue));
    expect(labels).not.toContain(mhdFormatAccommodationValue('NO_REASONABLE_OPTION'));
  });

  it('sends the essential functions an option touches and whether it removes one', async () => {
    addOptionMock.mockResolvedValue('new-option');
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /option/i }));
    openForm('Evaluate An Option');

    fireEvent.change(screen.getByPlaceholderText('Option description'), {
      target: { value: 'Reassign the cash-handling duty to a colleague.' },
    });
    fireEvent.change(screen.getByPlaceholderText('Expected effectiveness'), {
      target: { value: 'Removes the barrier for the full shift.' },
    });
    fireEvent.click(screen.getByLabelText('Handle cash at the register.'));
    fireEvent.click(screen.getByLabelText(/would remove an essential function/i));
    fireEvent.click(screen.getByRole('button', { name: /add option/i }));

    await waitFor(() => expect(addOptionMock).toHaveBeenCalledTimes(1));
    expect(addOptionMock.mock.calls[0][0]).toMatchObject({
      caseId: 'case-1',
      essentialFunctionIds: ['ef-1'],
      removesEssentialFunction: true,
    });
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
    rolesRef.current = ['Employee'];
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
    openForm('Record Restricted Medical Status');

    const requested = screen.getByLabelText(/Documentation requested/i);
    fireEvent.click(requested);
    expect(requested).toBeChecked();

    fireEvent.click(screen.getByLabelText(/Disability and need for accommodation are obvious/i));
    // Documentation cannot be requested for an obvious need, so the checkbox is
    // cleared and locked rather than merely warned about.
    expect(requested).not.toBeChecked();
    expect(requested).toBeDisabled();
  });

  it('records only the functional limitation and accommodation need', async () => {
    rolesRef.current = ['HR Partner'];
    detailRef.current = detail({ medical_status: [] });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));
    openForm('Record Restricted Medical Status');

    fireEvent.change(screen.getByLabelText('Functional limitation'), {
      target: { value: 'Cannot stand longer than 20 minutes.' },
    });
    fireEvent.change(screen.getByLabelText('Accommodation need'), {
      target: { value: 'Seated workstation.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /record restricted status/i }));

    await waitFor(() => expect(recordMedicalMock).toHaveBeenCalledTimes(1));
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
    openForm('Record Restricted Medical Status');

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

/* ------------------------------------------------------------------ */
/* Effectiveness review completion                                      */
/* ------------------------------------------------------------------ */

describe('effectiveness review completion', () => {
  const openReview = {
    id: 'review-1',
    implementation_id: 'impl-1',
    due_date: '2026-09-01',
    completed_at: null,
    effectiveness: null,
    summary: null,
    reengage_required: null,
  };

  function openReviewForm() {
    detailRef.current = detail({ reviews: [openReview] });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /implementation/i }));
    openForm('Complete Effectiveness Review');
  }

  function typeSummary(text: string) {
    fireEvent.change(screen.getByPlaceholderText(/how is the accommodation working/i), {
      target: { value: text },
    });
  }

  it('offers every outcome the database CHECK allows', () => {
    openReviewForm();
    const options = within(screen.getByLabelText('Review Outcome'))
      .getAllByRole('option')
      .map((option) => (option as HTMLOptionElement).value);
    expect(options).toEqual([
      'EFFECTIVE',
      'PARTIALLY_EFFECTIVE',
      'INEFFECTIVE',
      'NO_LONGER_NEEDED',
    ]);
  });

  it('sends the chosen outcome and typed summary, without re-engagement for EFFECTIVE', async () => {
    reviewMock.mockResolvedValue(undefined);
    openReviewForm();
    typeSummary('Works well; the seated station is in use daily.');
    fireEvent.click(screen.getByRole('button', { name: 'Complete Review' }));

    await waitFor(() =>
      expect(reviewMock).toHaveBeenCalledWith({
        reviewId: 'review-1',
        effectiveness: 'EFFECTIVE',
        summary: 'Works well; the seated station is in use daily.',
        reengageRequired: false,
      }),
    );
  });

  it.each(['PARTIALLY_EFFECTIVE', 'INEFFECTIVE'])(
    'forces re-engagement on for %s and locks the checkbox',
    async (outcome) => {
      reviewMock.mockResolvedValue(undefined);
      openReviewForm();
      fireEvent.change(screen.getByLabelText('Review Outcome'), { target: { value: outcome } });

      const checkbox = screen.getByLabelText('Re-Engage The Interactive Process');
      expect(checkbox).toBeChecked();
      expect(checkbox).toBeDisabled();

      typeSummary('The station does not reduce the strain.');
      fireEvent.click(screen.getByRole('button', { name: 'Complete Review' }));
      await waitFor(() =>
        expect(reviewMock).toHaveBeenCalledWith(
          expect.objectContaining({ effectiveness: outcome, reengageRequired: true }),
        ),
      );
    },
  );

  it('lets the administrator opt in to re-engagement for NO_LONGER_NEEDED', async () => {
    reviewMock.mockResolvedValue(undefined);
    openReviewForm();
    fireEvent.change(screen.getByLabelText('Review Outcome'), {
      target: { value: 'NO_LONGER_NEEDED' },
    });
    const checkbox = screen.getByLabelText('Re-Engage The Interactive Process');
    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeEnabled();
    fireEvent.click(checkbox);
    typeSummary('Role changed; revisit whether any support is still wanted.');
    fireEvent.click(screen.getByRole('button', { name: 'Complete Review' }));
    await waitFor(() =>
      expect(reviewMock).toHaveBeenCalledWith(
        expect.objectContaining({ effectiveness: 'NO_LONGER_NEEDED', reengageRequired: true }),
      ),
    );
  });

  it('requires a summary before the review can be completed', () => {
    openReviewForm();
    expect(screen.getByRole('button', { name: 'Complete Review' })).toBeDisabled();
    typeSummary('   ');
    expect(screen.getByRole('button', { name: 'Complete Review' })).toBeDisabled();
  });

  it('rejects a summary containing medical detail without calling the RPC', () => {
    openReviewForm();
    typeSummary('Back pain caused by the old chair, per the diagnosis.');
    fireEvent.click(screen.getByRole('button', { name: 'Complete Review' }));
    expect(reviewMock).not.toHaveBeenCalled();
    expect(screen.getByText(/not medical details/i)).toBeInTheDocument();
  });

  it('shows the server error text when the RPC refuses and keeps the draft', async () => {
    reviewMock.mockRejectedValue(new Error('Review not found'));
    openReviewForm();
    typeSummary('Working as intended.');
    fireEvent.click(screen.getByRole('button', { name: 'Complete Review' }));
    expect(await screen.findByText('Review not found')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/how is the accommodation working/i)).toHaveValue(
      'Working as intended.',
    );
  });
});

/* ------------------------------------------------------------------ */
/* Interaction visibility                                               */
/* ------------------------------------------------------------------ */

describe('interaction employee visibility', () => {
  function fillInteraction() {
    if (!screen.queryByRole('dialog')) openForm('Record Interaction');
    fireEvent.change(screen.getByPlaceholderText('What was discussed and understood?'), {
      target: { value: 'Reviewed scheduling alternatives.' },
    });
  }

  it('defaults to visible and passes employeeVisible true', async () => {
    interactionMock.mockResolvedValue('int-2');
    renderPage();
    openForm('Record Interaction');
    expect(screen.getByLabelText('Visible To The Employee')).toBeChecked();
    fillInteraction();
    fireEvent.click(screen.getByRole('button', { name: 'Add Interaction' }));
    await waitFor(() =>
      expect(interactionMock).toHaveBeenCalledWith(
        expect.objectContaining({ employeeVisible: true }),
      ),
    );
  });

  it('passes employeeVisible false when the box is cleared', async () => {
    interactionMock.mockResolvedValue('int-2');
    renderPage();
    openForm('Record Interaction');
    fireEvent.click(screen.getByLabelText('Visible To The Employee'));
    fillInteraction();
    fireEvent.click(screen.getByRole('button', { name: 'Add Interaction' }));
    await waitFor(() =>
      expect(interactionMock).toHaveBeenCalledWith(
        expect.objectContaining({ employeeVisible: false }),
      ),
    );
  });

  it('labels a not-visible interaction as staff only in the list', () => {
    detailRef.current = detail({
      interactions: [
        {
          id: 'int-private',
          occurred_at: '2026-07-21T17:00:00.000Z',
          channel: 'MEETING',
          participants: [],
          summary: 'Internal note on option feasibility.',
          next_step: null,
          next_step_due: null,
          employee_visible: false,
        },
      ],
    });
    renderPage();
    expect(screen.getByText('Staff only')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Provider certification: the medical partition, absent not hidden    */
/* ------------------------------------------------------------------ */

const PROVIDER_CERTIFICATION: MhdAccommodationProviderCertification = {
  id: crypto.randomUUID(),
  certified_at: '2026-07-30',
  disability_verified: true,
  limitation_duration: 'TEMPORARY',
  limitation_end_date: '2026-12-31',
  accommodation_begin_on: '2026-08-01',
  accommodation_end_on: null,
  accommodation_continuous: true,
  job_duty_statement_sent_at: '2026-07-22',
  has_provider_name: true,
  has_recommendation: true,
  has_attachment: false,
};

describe('the provider certification panel', () => {
  it.each(['Client Admin', 'HR Specialist', 'Director', 'Employee'] as MhdAuthRoleName[])(
    'is absent from the DOM for %s',
    (role) => {
      rolesRef.current = [role];
      detailRef.current = detail({ provider_certification: PROVIDER_CERTIFICATION });
      renderPage();

      expect(
        screen.queryByRole('tab', { name: /provider certification/i }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/Reveal Provider And Recommendation/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Record Provider Certification')).not.toBeInTheDocument();
    },
  );

  it.each(['Platform Admin', 'HR Partner', 'HR Admin'] as MhdAuthRoleName[])(
    'is offered to the medical role %s',
    (role) => {
      rolesRef.current = [role];
      detailRef.current = detail({ provider_certification: PROVIDER_CERTIFICATION });
      renderPage();

      fireEvent.click(screen.getByRole('tab', { name: /provider certification/i }));
      expect(screen.getByText('Record Provider Certification')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Reveal Provider And Recommendation' }),
      ).toBeInTheDocument();
    },
  );

  it('reveals the provider and recommendation only after the button is clicked', async () => {
    rolesRef.current = ['HR Admin'];
    detailRef.current = detail({ provider_certification: PROVIDER_CERTIFICATION });
    providerRevealMock.mockResolvedValue({
      provider_name: 'Dr. Imani Okafor',
      recommendation: 'Seated workstation with a break every hour.',
    });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /provider certification/i }));

    expect(providerRevealMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Dr. Imani Okafor')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reveal Provider And Recommendation' }));
    expect(await screen.findByText('Dr. Imani Okafor')).toBeInTheDocument();
    expect(providerRevealMock).toHaveBeenCalledTimes(1);
    expect(providerRevealMock).toHaveBeenCalledWith(PROVIDER_CERTIFICATION.id);
  });
});

/* ------------------------------------------------------------------ */
/* Decision and implementation are offered only in their status        */
/* ------------------------------------------------------------------ */

describe('status gating for decide and implement', () => {
  const activeDecision = {
    id: 'decision-1',
    outcome: 'APPROVED' as const,
    selected_option_id: OPTION_GOOD.id,
    denial_reason_code: null,
    denial_reasons: [],
    decision_summary: 'Granted the later start.',
    alternatives_considered: true,
    interactive_process_continues: false,
    decided_at: '2026-07-24T17:00:00.000Z',
    superseded_at: null,
  };

  it.each(['INTERACTIVE_PROCESS', 'DOCUMENTATION_PENDING', 'DECIDED', 'ACTIVE'] as const)(
    'offers no decision form while the case is %s, and says why',
    (status) => {
      detailRef.current = withStatus(status);
      renderPage();
      fireEvent.click(screen.getByRole('tab', { name: /decision/i }));

      expect(screen.queryByRole('button', { name: /record decision/i })).not.toBeInTheDocument();
      expect(
        screen.getByText(/A decision is recorded while the case is in Evaluation/),
      ).toHaveTextContent(mhdFormatAccommodationValue(status));
    },
  );

  it('offers the decision form in EVALUATION', () => {
    detailRef.current = withStatus('EVALUATION');
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /decision/i }));
    const dialog = openForm('Decide Request');
    expect(within(dialog).getByRole('button', { name: /record decision/i })).toBeInTheDocument();
  });

  it.each(['EVALUATION', 'IMPLEMENTING', 'ACTIVE'] as const)(
    'offers no implementation form while the case is %s',
    (status) => {
      detailRef.current = { ...withStatus(status), decisions: [activeDecision] };
      renderPage();
      fireEvent.click(screen.getByRole('tab', { name: /implementation/i }));

      expect(
        screen.queryByRole('button', { name: 'Implement Accommodation' }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/implemented once the case is Decided/)).toBeInTheDocument();
    },
  );

  it('sends the equipment fields and warns that the case waits for ordered equipment', async () => {
    detailRef.current = { ...withStatus('DECIDED'), decisions: [activeDecision] };
    implementMock.mockResolvedValue('implementation-1');
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /implementation/i }));
    openForm('Implement Accommodation');

    fireEvent.change(screen.getByPlaceholderText(/Manager-safe implementation instruction/i), {
      target: { value: 'Seated workstation at the register.' },
    });
    expect(screen.queryByText(/Waiting For Equipment/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Equipment Ordered On'), {
      target: { value: '08/03/2026' },
    });
    expect(screen.getByText(/Waiting For Equipment/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Activate Accommodation' }));
    await waitFor(() =>
      expect(implementMock).toHaveBeenCalledWith(
        expect.objectContaining({
          optionId: OPTION_GOOD.id,
          equipmentOrderedOn: '2026-08-03',
          equipmentOrderedBy: null,
          equipmentReceivedOn: null,
        }),
      ),
    );
  });
});

/* ------------------------------------------------------------------ */
/* Combinable denial reasons                                           */
/* ------------------------------------------------------------------ */

const DENIAL_VOCABULARY: MhdAccommodationDenialReasonCode[] = MHD_ACCOMMODATION_DENIAL_REASONS.map(
  (code, index) => ({
    code,
    label:
      code === 'UNDUE_HARDSHIP'
        ? 'Accommodation would cause undue hardship'
        : mhdFormatAccommodationValue(code),
    sortOrder: (index + 1) * 10,
    requiresDetail: MHD_ACCOMMODATION_DENIAL_REASON_RULES[code].requiresDetail,
    detailPrompt: code === 'UNDUE_HARDSHIP' ? 'Identify the hardship' : 'Identify the reason',
    requiresAlternative: MHD_ACCOMMODATION_DENIAL_REASON_RULES[code].requiresAlternative,
    alternativePrompt:
      code === 'EMPLOYEE_REJECTED_ALTERNATIVE' ? 'The accommodation offered' : null,
  }),
);

describe('the denial form', () => {
  beforeEach(() => {
    denialCodesRef.current = DENIAL_VOCABULARY;
    detailRef.current = withStatus('EVALUATION');
  });

  function startDenial() {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /decision/i }));
    openForm('Decide Request');
    fireEvent.change(screen.getByDisplayValue('Approved'), { target: { value: 'DENIED' } });
    fireEvent.change(screen.getByPlaceholderText('Decision summary'), {
      target: { value: 'Not granted as requested.' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Individualized analysis and alternatives considered'),
      { target: { value: 'Remote work and reassignment were costed and evaluated.' } },
    );
  }

  it('renders the labels from the vocabulary table', () => {
    startDenial();
    expect(screen.getByLabelText('Accommodation would cause undue hardship')).toBeInTheDocument();
  });

  it('blocks the decision until every checked reason has its specifics', () => {
    startDenial();
    const record = screen.getByRole('button', { name: /record decision/i });
    expect(record).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Accommodation would cause undue hardship'));
    expect(record).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Identify the hardship'), {
      target: { value: 'A second register would cost more than the store budget allows.' },
    });
    expect(record).not.toBeDisabled();

    fireEvent.click(screen.getByLabelText('Employee Rejected Alternative'));
    expect(record).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Identify the reason'), {
      target: { value: 'Preferred to keep the current shift.' },
    });
    expect(record).toBeDisabled();
    fireEvent.change(screen.getByLabelText('The accommodation offered'), {
      target: { value: 'A stool at the register.' },
    });
    expect(record).not.toBeDisabled();
  });

  it('forces and locks Interactive Process Continues for undue hardship and sends every reason', async () => {
    decideMock.mockResolvedValue('decision-2');
    startDenial();
    const continues = screen.getByLabelText(/Interactive Process Continues/);
    expect(continues).not.toBeChecked();
    expect(continues).toBeEnabled();

    fireEvent.click(screen.getByLabelText('Accommodation would cause undue hardship'));
    expect(continues).toBeChecked();
    expect(continues).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Identify the hardship'), {
      target: { value: 'A second register would cost more than the store budget allows.' },
    });
    fireEvent.click(screen.getByLabelText('Ineffective'));
    fireEvent.click(screen.getByRole('button', { name: /record decision/i }));

    await waitFor(() => expect(decideMock).toHaveBeenCalledTimes(1));
    expect(decideMock.mock.calls[0][0]).toMatchObject({
      outcome: 'DENIED',
      interactiveProcessContinues: true,
      denialReasons: [
        {
          code: 'UNDUE_HARDSHIP',
          detail: 'A second register would cost more than the store budget allows.',
        },
        { code: 'INEFFECTIVE' },
      ],
    });
    expect(decideMock.mock.calls[0][0]).not.toHaveProperty('denialReasonCode');
  });

  it('asks for reasons on a partial approval too', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /decision/i }));
    openForm('Decide Request');
    fireEvent.change(screen.getByDisplayValue('Approved'), {
      target: { value: 'PARTIALLY_APPROVED' },
    });
    expect(screen.getByRole('group', { name: 'Reasons For The Denial' })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Equipment on an existing implementation                             */
/* ------------------------------------------------------------------ */

describe('updating equipment on an implementation', () => {
  const implementation = {
    id: crypto.randomUUID(),
    option_id: OPTION_GOOD.id,
    status: 'IN_PROGRESS',
    start_date: '2026-08-01',
    end_date: null,
    manager_instruction: 'Seated workstation at the register.',
    review_due_date: null,
    equipment_ordered_on: '2026-08-03',
    equipment_ordered_by: null,
    equipment_received_on: null,
  };

  function openImplementation() {
    detailRef.current = { ...withStatus('IMPLEMENTING'), implementations: [implementation] };
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /implementation/i }));
  }

  function openEquipmentForm() {
    openImplementation();
    openForm('Update Equipment');
  }

  it('shows the waiting note for ordered but not received equipment', () => {
    openImplementation();
    expect(screen.getByText(/Waiting For Equipment/)).toBeInTheDocument();
  });

  it('rejects a received date before the order date with the schema message', async () => {
    openEquipmentForm();
    fireEvent.change(screen.getByLabelText('Equipment Received On'), {
      target: { value: '08/01/2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Equipment Dates' }));

    expect(
      await screen.findByText('Equipment cannot be received before it was ordered.'),
    ).toBeInTheDocument();
    expect(equipmentMock).not.toHaveBeenCalled();
    expect(mockDraft.discard).not.toHaveBeenCalled();
  });

  it('records the receipt date', async () => {
    equipmentMock.mockResolvedValue(undefined);
    openEquipmentForm();
    fireEvent.change(screen.getByLabelText('Equipment Received On'), {
      target: { value: '08/12/2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Equipment Dates' }));

    await waitFor(() =>
      expect(equipmentMock).toHaveBeenCalledWith({
        implementationId: implementation.id,
        orderedOn: '2026-08-03',
        orderedBy: null,
        receivedOn: '2026-08-12',
      }),
    );
  });
});

/* ------------------------------------------------------------------ */
/* Request details and documentation type                              */
/* ------------------------------------------------------------------ */

describe('request details and documentation type', () => {
  it('opens Section A for the employee on their own case with the certify button', () => {
    rolesRef.current = ['Employee'];
    profileRef.current = { companyId: 'company-1', personId: 'person-1' };
    detailRef.current = detail({
      request_details: {
        id: crypto.randomUUID(),
        limitation_duration: 'PERMANENT',
        anticipated_recovery_date: null,
        workers_comp_claim: false,
        workers_comp_claim_filed_on: null,
        leave_requested: false,
        leave_request_details: null,
        employee_certified_at: null,
        employee_certified_method: null,
        contact_phone: null,
        contact_email: null,
        work_location: null,
        supervisor_name: null,
        supervisor_person_id: null,
      },
    });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /request details/i }));

    expect(
      screen.getByRole('button', {
        name: 'I Certify That I Have A Disability That Requires Reasonable Accommodation',
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Record Employee Certification' }),
    ).not.toBeInTheDocument();
  });

  it('offers Employee Statement as a documentation type', () => {
    rolesRef.current = ['HR Partner'];
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));
    openForm('Record Restricted Medical Status');
    expect(screen.getByRole('option', { name: 'Employee Statement' })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/* Save and resume drafts on the case modals                           */
/* ------------------------------------------------------------------ */

describe('case action modals save and resume drafts', () => {
  it('opens Record Interaction as a dialog and saves its values under the case key', async () => {
    renderPage();
    const dialog = openForm('Record Interaction');
    fireEvent.change(within(dialog).getByPlaceholderText('What was discussed and understood?'), {
      target: { value: 'Talked through a later start time.' },
    });
    fireEvent.change(within(dialog).getByPlaceholderText('Next step'), {
      target: { value: 'Confirm with the shift lead.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload).toEqual({
      interactionChannel: 'VERBAL',
      summary: 'Talked through a later start time.',
      nextStep: 'Confirm with the shift lead.',
      employeeVisible: true,
    });
    expect(draftOptionsLog.at(-1)).toMatchObject({
      draftKind: 'ACCOMMODATION_CASE_ACTION',
      draftKey: 'case-1:interaction',
      companyId: 'company-1',
    });
  });

  it('restores a saved interaction draft on Resume Draft', () => {
    mockDraft.draft = {
      id: crypto.randomUUID(),
      draftKind: 'ACCOMMODATION_CASE_ACTION',
      draftKey: 'case-1:interaction',
      title: null,
      stepKey: null,
      payload: {
        interactionChannel: 'PHONE',
        summary: 'Walked the floor to find a seated station.',
        nextStep: 'Order the stool.',
        employeeVisible: false,
      },
      updatedAt: '2026-11-20T15:00:00Z',
      expiresAt: '2026-12-20T15:00:00Z',
    };
    renderPage();
    const dialog = openForm('Record Interaction');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));

    expect(within(dialog).getByPlaceholderText('What was discussed and understood?')).toHaveValue(
      'Walked the floor to find a seated station.',
    );
    expect(within(dialog).getByPlaceholderText('Next step')).toHaveValue('Order the stool.');
    expect(within(dialog).getByLabelText('Visible To The Employee')).not.toBeChecked();
    expect(within(dialog).getByDisplayValue('Phone')).toBeInTheDocument();
  });

  it('discards the draft and closes the dialog after a successful submit', async () => {
    interactionMock.mockResolvedValue('int-3');
    renderPage();
    const dialog = openForm('Record Interaction');
    fireEvent.change(within(dialog).getByPlaceholderText('What was discussed and understood?'), {
      target: { value: 'Agreed on the seated station.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Interaction' }));

    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('keeps the dialog and the draft when the server refuses the action', async () => {
    interactionMock.mockRejectedValue(new Error('The case is closed.'));
    renderPage();
    const dialog = openForm('Record Interaction');
    fireEvent.change(within(dialog).getByPlaceholderText('What was discussed and understood?'), {
      target: { value: 'Agreed on the seated station.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Interaction' }));

    expect(await within(dialog).findByText('The case is closed.')).toBeInTheDocument();
    expect(mockDraft.discard).not.toHaveBeenCalled();
  });

  it('never puts the functional limitation or accommodation need in the medical-status draft', async () => {
    rolesRef.current = ['HR Partner'];
    detailRef.current = detail({ medical_status: [] });
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));
    const dialog = openForm('Record Restricted Medical Status');
    expect(
      within(dialog).getByText('Medical details are not saved in drafts.'),
    ).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('Functional limitation'), {
      target: { value: 'Cannot stand longer than 20 minutes.' },
    });
    fireEvent.change(within(dialog).getByLabelText('Accommodation need'), {
      target: { value: 'Seated workstation.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    const payload = mockDraft.save.mock.calls[0][0].payload;
    expect(payload).toMatchObject({
      documentationType: 'SIMPLE_CERTIFICATION',
      documentationStatus: 'NOT_NEEDED',
    });
    expect(payload).not.toHaveProperty('functionalLimitation');
    expect(payload).not.toHaveProperty('accommodationNeed');
    expect(JSON.stringify(payload)).not.toMatch(/stand longer|Seated workstation/);
  });

  it('restores a decision draft, including its denial reasons', () => {
    detailRef.current = withStatus('EVALUATION');
    mockDraft.draft = {
      id: crypto.randomUUID(),
      draftKind: 'ACCOMMODATION_CASE_ACTION',
      draftKey: 'case-1:decision',
      title: null,
      stepKey: null,
      payload: {
        outcome: 'DENIED',
        selectedOptionId: '',
        analysis: 'Reassignment and remote work were evaluated.',
        denialReasons: [{ code: 'INEFFECTIVE' }, { code: 'NOT_A_REAL_CODE' }],
        processContinues: true,
        decisionSummary: 'Not granted as requested.',
      },
      updatedAt: '2026-11-20T15:00:00Z',
      expiresAt: '2026-12-20T15:00:00Z',
    };
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /decision/i }));
    const dialog = openForm('Decide Request');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));

    expect(within(dialog).getByLabelText('Decision Outcome')).toHaveValue('DENIED');
    expect(within(dialog).getByPlaceholderText('Decision summary')).toHaveValue(
      'Not granted as requested.',
    );
    expect(within(dialog).getByLabelText('Ineffective')).toBeChecked();
    expect(within(dialog).getByRole('button', { name: /record decision/i })).not.toBeDisabled();
  });
});
