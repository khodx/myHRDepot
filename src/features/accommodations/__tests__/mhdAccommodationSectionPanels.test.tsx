import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdDocumentTemplate } from '@/features/documents/Types';
import {
  MHD_ACCOMMODATION_DENIAL_REASONS,
  mhdFormatAccommodationValue,
  type MhdAccommodationDenialReasonCode,
  type MhdAccommodationDenialReasonInput,
  type MhdAccommodationProviderCertification,
  type MhdAccommodationRequestDetails,
} from '../Types';

const {
  revealMock,
  resetMock,
  listTemplatesMock,
  generateMock,
  recordNoticeMock,
  authRef,
  mockDraft,
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
  revealMock: vi.fn(),
  resetMock: vi.fn(),
  listTemplatesMock: vi.fn(),
  generateMock: vi.fn(),
  recordNoticeMock: vi.fn(),
  authRef: {
    current: {
      authUserId: 'auth-user-1',
      profile: { companyId: 'company-1', personId: null as string | null },
    },
  },
}));

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => authRef.current }));

vi.mock('@/features/drafts/Hook', () => ({ useMhdDraft: () => mockDraft }));

vi.mock('@/features/documents/Service', () => ({
  mhdDocumentService: { listTemplates: listTemplatesMock, generateAndPoll: generateMock },
}));

vi.mock('../Hook', () => ({
  useMhdAccommodationProviderCertificationReveal: () => ({
    mutateAsync: revealMock,
    isPending: false,
    reset: resetMock,
  }),
  useMhdAccommodationNotices: () => ({ data: [], isLoading: false }),
  useMhdAccommodationNotice: () => ({ mutateAsync: recordNoticeMock, isPending: false }),
  useMhdAccommodationNoticeDelivery: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { MhdAccommodationRequestDetailsPanel } =
  await import('../components/MhdAccommodationRequestDetailsPanel');
const { MhdAccommodationProviderCertPanel } =
  await import('../components/MhdAccommodationProviderCertPanel');
const { MhdAccommodationEquipmentFields } =
  await import('../components/MhdAccommodationEquipmentFields');
const { MhdAccommodationDenialReasonsField } =
  await import('../components/MhdAccommodationDenialReasonsField');
const { MhdAccommodationNoticesPanel } = await import('../components/MhdAccommodationNoticesPanel');

const CASE_ID = crypto.randomUUID();
const COMPANY_ID = crypto.randomUUID();

function savedDraft(payload: Record<string, unknown>) {
  return {
    id: crypto.randomUUID(),
    draftKind: 'ACCOMMODATION_CASE_ACTION',
    draftKey: CASE_ID,
    title: null,
    stepKey: null,
    payload,
    updatedAt: '2026-11-20T15:00:00Z',
    expiresAt: '2026-12-20T15:00:00Z',
  };
}

/** Input forms open in a modal from an action button; this opens one and returns the dialog. */
function openForm(launcher: string) {
  fireEvent.click(screen.getByRole('button', { name: launcher }));
  return screen.getByRole('dialog');
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDraft.draft = null;
  mockDraft.save.mockResolvedValue(undefined);
  mockDraft.discard.mockResolvedValue(undefined);
});

/* ------------------------------------------------------------------ */
/* Section A                                                           */
/* ------------------------------------------------------------------ */

function requestDetails(
  overrides: Partial<MhdAccommodationRequestDetails> = {},
): MhdAccommodationRequestDetails {
  return {
    id: crypto.randomUUID(),
    limitation_duration: null,
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
    ...overrides,
  };
}

function renderRequestDetails(
  props: Partial<Parameters<typeof MhdAccommodationRequestDetailsPanel>[0]> = {},
) {
  const onSave = vi.fn().mockResolvedValue('details-1');
  const onCertify = vi.fn().mockResolvedValue('2026-08-01T00:00:00Z');
  render(
    <MhdAccommodationRequestDetailsPanel
      caseId={CASE_ID}
      companyId={COMPANY_ID}
      details={null}
      caseStatus="INTERACTIVE_PROCESS"
      isOwnCase={false}
      canAdminister
      isPending={false}
      onSave={onSave}
      onCertify={onCertify}
      {...props}
    />,
  );
  return { onSave, onCertify };
}

describe('MhdAccommodationRequestDetailsPanel', () => {
  it('enables the recovery date only for a temporary limitation', () => {
    renderRequestDetails();
    openForm('Edit Request Details');
    const recovery = screen.getByLabelText('Anticipated Recovery Date');
    expect(recovery).toBeDisabled();

    fireEvent.click(screen.getByLabelText('Temporary'));
    expect(recovery).toBeEnabled();
    fireEvent.change(recovery, { target: { value: '12/31/2026' } });
    expect(recovery).toHaveValue('12/31/2026');

    fireEvent.click(screen.getByLabelText('Permanent'));
    expect(recovery).toBeDisabled();
    expect(recovery).toHaveValue('');
  });

  it('collects every Section A field and saves the validated values', async () => {
    const { onSave } = renderRequestDetails();
    openForm('Edit Request Details');
    fireEvent.click(screen.getByLabelText('Temporary'));
    fireEvent.change(screen.getByLabelText('Anticipated Recovery Date'), {
      target: { value: '12/31/2026' },
    });
    const workersComp = screen.getByRole('group', { name: "Workers' Compensation Claim" });
    expect(screen.getByLabelText('Claim Filed On')).toBeDisabled();
    fireEvent.click(within(workersComp).getByLabelText('Yes'));
    fireEvent.change(screen.getByLabelText('Claim Filed On'), { target: { value: '07/15/2026' } });
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Leave Requested' })).getByLabelText('Yes'),
    );
    fireEvent.change(screen.getByLabelText('Leave Request Details'), {
      target: { value: 'Two weeks from September 1.' },
    });
    fireEvent.change(screen.getByLabelText('Contact Phone'), {
      target: { value: '(510) 555-0142' },
    });
    fireEvent.change(screen.getByLabelText('Contact Email'), {
      target: { value: 'renata.alvarez@example.org' },
    });
    fireEvent.change(screen.getByLabelText('Work Location'), {
      target: { value: 'Oakland warehouse' },
    });
    fireEvent.change(screen.getByLabelText('Supervisor Name'), {
      target: { value: 'Marcus Lindqvist' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Request Details' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        caseId: CASE_ID,
        limitationDuration: 'TEMPORARY',
        anticipatedRecoveryDate: '2026-12-31',
        workersCompClaim: true,
        workersCompClaimFiledOn: '2026-07-15',
        leaveRequested: true,
        leaveRequestDetails: 'Two weeks from September 1.',
        contactPhone: '(510) 555-0142',
        contactEmail: 'renata.alvarez@example.org',
        workLocation: 'Oakland warehouse',
        supervisorName: 'Marcus Lindqvist',
        supervisorPersonId: null,
      }),
    );
  });

  it('shows schema field errors and does not save', async () => {
    const { onSave } = renderRequestDetails();
    openForm('Edit Request Details');
    fireEvent.change(screen.getByLabelText('Contact Email'), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText('Work Location'), {
      target: { value: 'Near the clinic that made the diagnosis' },
    });
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Leave Requested' })).getByLabelText('Yes'),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save Request Details' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(screen.getByText('Say what leave was requested and when.')).toBeInTheDocument();
    expect(screen.getByText(/Do not enter a diagnosis, causation statement/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('lets the employee certify their own request once, by self-service', async () => {
    const { onCertify } = renderRequestDetails({
      details: requestDetails(),
      isOwnCase: true,
      canAdminister: false,
    });
    expect(screen.queryByRole('button', { name: 'Record Employee Certification' })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'I Certify That I Have A Disability That Requires Reasonable Accommodation',
      }),
    );
    await waitFor(() => expect(onCertify).toHaveBeenCalledWith('SELF_SERVICE'));
  });

  it('makes the form read-only for the employee after certification', () => {
    renderRequestDetails({
      details: requestDetails({
        employee_certified_at: '2026-08-01T15:00:00Z',
        employee_certified_method: 'SELF_SERVICE',
      }),
      isOwnCase: true,
      canAdminister: false,
    });
    expect(screen.queryByRole('button', { name: 'Edit Request Details' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save Request Details' })).toBeNull();
    expect(screen.queryByRole('button', { name: /I Certify/ })).toBeNull();
    expect(screen.getByText(/Self-Service/)).toBeInTheDocument();
  });

  it('keeps the form editable for an administrator after certification', () => {
    renderRequestDetails({
      details: requestDetails({
        employee_certified_at: '2026-08-01T15:00:00Z',
        employee_certified_method: 'SELF_SERVICE',
      }),
    });
    openForm('Edit Request Details');
    expect(screen.getByLabelText('Contact Phone')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Save Request Details' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record Employee Certification' })).toBeNull();
  });

  it('lets an administrator record a paper or e-signature certification', async () => {
    const { onCertify } = renderRequestDetails({ details: requestDetails() });
    expect(screen.queryByRole('button', { name: /I Certify/ })).toBeNull();
    openForm('Record Employee Certification');
    const method = screen.getByLabelText('Certification Method');
    expect(
      within(method)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['In-Person Paper', 'E-Signature']);
    fireEvent.change(method, { target: { value: 'E_SIGNATURE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Certification' }));
    await waitFor(() => expect(onCertify).toHaveBeenCalledWith('E_SIGNATURE'));
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalledTimes(1));
  });

  it('is read-only for everyone while the case is closed', () => {
    renderRequestDetails({ details: requestDetails(), caseStatus: 'CLOSED' });
    expect(screen.queryByRole('button', { name: 'Edit Request Details' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save Request Details' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Record Employee Certification' })).toBeNull();
  });

  it('shows the server refusal text', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('A closed case cannot be edited'));
    renderRequestDetails({ onSave });
    openForm('Edit Request Details');
    fireEvent.click(screen.getByRole('button', { name: 'Save Request Details' }));
    expect(await screen.findByText('A closed case cannot be edited')).toBeInTheDocument();
    expect(mockDraft.discard).not.toHaveBeenCalled();
  });

  it('shows the saved details read-only on the panel', () => {
    renderRequestDetails({
      details: requestDetails({
        contact_phone: '(510) 555-0142',
        work_location: 'Oakland warehouse',
      }),
    });
    expect(screen.getByText('(510) 555-0142')).toBeInTheDocument();
    expect(screen.getByText('Oakland warehouse')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('drafts every field, the limitation and recovery date included', async () => {
    renderRequestDetails();
    const dialog = openForm('Edit Request Details');
    expect(within(dialog).queryByText(/not saved in drafts/)).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByLabelText('Temporary'));
    fireEvent.change(within(dialog).getByLabelText('Anticipated Recovery Date'), {
      target: { value: '12/31/2026' },
    });
    fireEvent.change(within(dialog).getByLabelText('Contact Phone'), {
      target: { value: '(510) 555-0142' },
    });
    fireEvent.change(within(dialog).getByLabelText('Work Location'), {
      target: { value: 'Oakland warehouse' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    const payload = mockDraft.save.mock.calls[0][0].payload;
    expect(payload).toMatchObject({
      limitationDuration: 'TEMPORARY',
      anticipatedRecoveryDate: '2026-12-31',
      contactPhone: '(510) 555-0142',
      workLocation: 'Oakland warehouse',
    });
  });

  it('restores every drafted field on Resume Draft and discards the draft once saved', async () => {
    mockDraft.draft = savedDraft({
      limitationDuration: 'TEMPORARY',
      anticipatedRecoveryDate: '2026-12-31',
      contactEmail: 'renata.alvarez@example.org',
      supervisorName: 'Marcus Lindqvist',
      leaveRequested: true,
      leaveRequestDetails: 'Two weeks from September 1.',
    });
    const { onSave } = renderRequestDetails();
    const dialog = openForm('Edit Request Details');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));

    expect(within(dialog).getByLabelText('Temporary')).toBeChecked();
    expect(within(dialog).getByLabelText('Anticipated Recovery Date')).toHaveValue('12/31/2026');
    expect(within(dialog).getByLabelText('Contact Email')).toHaveValue(
      'renata.alvarez@example.org',
    );
    expect(within(dialog).getByLabelText('Supervisor Name')).toHaveValue('Marcus Lindqvist');
    expect(within(dialog).getByLabelText('Leave Request Details')).toHaveValue(
      'Two weeks from September 1.',
    );

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Request Details' }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

/* ------------------------------------------------------------------ */
/* Section B                                                           */
/* ------------------------------------------------------------------ */

const CERTIFICATION: MhdAccommodationProviderCertification = {
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

function renderProvider(certification: MhdAccommodationProviderCertification | null) {
  const onSave = vi.fn().mockResolvedValue('certification-1');
  const view = render(
    <MhdAccommodationProviderCertPanel
      caseId={CASE_ID}
      companyId={COMPANY_ID}
      certification={certification}
      onSave={onSave}
      isPending={false}
    />,
  );
  return { onSave, ...view };
}

describe('MhdAccommodationProviderCertPanel', () => {
  it('never calls the reveal until the button is clicked', async () => {
    revealMock.mockResolvedValue({
      provider_name: 'Dr. Imani Okafor',
      recommendation: 'Seated workstation with an hourly break.',
    });
    renderProvider(CERTIFICATION);
    expect(revealMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Dr. Imani Okafor')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Reveal Provider And Recommendation' }));
    expect(await screen.findByText('Dr. Imani Okafor')).toBeInTheDocument();
    expect(revealMock).toHaveBeenCalledWith(CERTIFICATION.id);
    // The revealed values also fill the form, so a later save keeps them instead of erasing them.
    openForm('Record Provider Certification');
    expect(screen.getByLabelText('Provider Name')).toHaveValue('Dr. Imani Okafor');
    expect(screen.getByLabelText('Recommendation')).toHaveValue(
      'Seated workstation with an hourly break.',
    );
  });

  it('discards the revealed values when the panel unmounts', async () => {
    revealMock.mockResolvedValue({ provider_name: 'Dr. Imani Okafor', recommendation: null });
    const { unmount } = renderProvider(CERTIFICATION);
    fireEvent.click(screen.getByRole('button', { name: 'Reveal Provider And Recommendation' }));
    await screen.findByText('Dr. Imani Okafor');
    unmount();
    expect(resetMock).toHaveBeenCalled();
  });

  it('offers no reveal when nothing encrypted is on file', () => {
    renderProvider(null);
    expect(screen.queryByRole('button', { name: /Reveal/ })).toBeNull();
    expect(screen.getByText('No provider certification is recorded yet.')).toBeInTheDocument();
  });

  it('carries the functional-wording helper text on the recommendation', () => {
    renderProvider(null);
    openForm('Record Provider Certification');
    expect(screen.getByLabelText('Recommendation')).toHaveAccessibleDescription(
      /Do not enter a diagnosis, cause, genetic information, or medical records/,
    );
  });

  it('refuses to save over an encrypted value that was not revealed or re-entered', async () => {
    const { onSave } = renderProvider(CERTIFICATION);
    openForm('Record Provider Certification');
    fireEvent.click(screen.getByRole('button', { name: 'Save Provider Certification' }));
    expect(await screen.findByText(/A provider name is on file/)).toBeInTheDocument();
    expect(screen.getByText(/A recommendation is on file/)).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('rejects prohibited medical detail in the recommendation', async () => {
    const { onSave } = renderProvider(null);
    openForm('Record Provider Certification');
    fireEvent.change(screen.getByLabelText('Recommendation'), {
      target: { value: 'Symptoms caused by a prior injury.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Provider Certification' }));
    expect(
      await screen.findByText(/Do not enter a diagnosis, causation statement/),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('enables the limitation end date only for a temporary limitation and saves', async () => {
    const { onSave } = renderProvider(null);
    openForm('Record Provider Certification');
    const endDate = screen.getByLabelText('Limitation End Date');
    expect(endDate).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Duration'), { target: { value: 'TEMPORARY' } });
    expect(endDate).toBeEnabled();
    fireEvent.change(endDate, { target: { value: '12/31/2026' } });
    fireEvent.change(screen.getByLabelText('Provider Name'), {
      target: { value: 'Dr. Imani Okafor' },
    });
    fireEvent.change(screen.getByLabelText('Certified On'), { target: { value: '07/30/2026' } });
    fireEvent.click(screen.getByLabelText('Disability Verified'));
    fireEvent.click(screen.getByLabelText('Accommodation Is Continuous'));
    expect(screen.getByLabelText('Accommodation Ends On')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Recommendation'), {
      target: { value: 'Seated workstation with an hourly break.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Provider Certification' }));

    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        caseId: CASE_ID,
        providerName: 'Dr. Imani Okafor',
        certifiedAt: '2026-07-30',
        disabilityVerified: true,
        limitationDuration: 'TEMPORARY',
        limitationEndDate: '2026-12-31',
        accommodationBeginOn: null,
        accommodationEndOn: null,
        accommodationContinuous: true,
        recommendation: 'Seated workstation with an hourly break.',
        jobDutyStatementSentAt: null,
      }),
    );
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalledTimes(1));
  });

  it('drafts every certification field, provider and recommendation included', async () => {
    renderProvider(null);
    const dialog = openForm('Record Provider Certification');
    expect(within(dialog).queryByText(/not saved in drafts/)).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText('Job-Duty Statement Sent On'), {
      target: { value: '07/22/2026' },
    });
    fireEvent.change(within(dialog).getByLabelText('Provider Name'), {
      target: { value: 'Dr. Imani Okafor' },
    });
    fireEvent.change(within(dialog).getByLabelText('Recommendation'), {
      target: { value: 'Seated workstation with an hourly break.' },
    });
    fireEvent.click(within(dialog).getByLabelText('Disability Verified'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload).toEqual({
      jobDutyStatementSentAt: '2026-07-22',
      providerName: 'Dr. Imani Okafor',
      certifiedAt: '',
      disabilityVerified: true,
      limitationDuration: '',
      limitationEndDate: '',
      accommodationBeginOn: '',
      accommodationEndOn: '',
      accommodationContinuous: false,
      recommendation: 'Seated workstation with an hourly break.',
    });
  });

  it('restores every drafted certification field on Resume Draft', () => {
    mockDraft.draft = savedDraft({
      jobDutyStatementSentAt: '2026-07-22',
      providerName: 'Dr. Imani Okafor',
      disabilityVerified: true,
      limitationDuration: 'TEMPORARY',
      limitationEndDate: '2026-12-31',
      recommendation: 'Seated workstation with an hourly break.',
    });
    renderProvider(null);
    const dialog = openForm('Record Provider Certification');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));
    expect(within(dialog).getByLabelText('Job-Duty Statement Sent On')).toHaveValue('07/22/2026');
    expect(within(dialog).getByLabelText('Provider Name')).toHaveValue('Dr. Imani Okafor');
    expect(within(dialog).getByLabelText('Disability Verified')).toBeChecked();
    expect(within(dialog).getByLabelText('Duration')).toHaveValue('TEMPORARY');
    expect(within(dialog).getByLabelText('Limitation End Date')).toHaveValue('12/31/2026');
    expect(within(dialog).getByLabelText('Recommendation')).toHaveValue(
      'Seated workstation with an hourly break.',
    );
  });
});

/* ------------------------------------------------------------------ */
/* Equipment fields                                                    */
/* ------------------------------------------------------------------ */

describe('MhdAccommodationEquipmentFields', () => {
  const USER_ID = crypto.randomUUID();

  function Harness({ disabled = false }: { disabled?: boolean }) {
    const [value, setValue] = useState({ orderedOn: '', orderedBy: '', receivedOn: '' });
    return (
      <>
        <MhdAccommodationEquipmentFields
          idPrefix="test"
          value={value}
          onChange={setValue}
          disabled={disabled}
          userOptions={[{ id: USER_ID, displayName: 'Keiko Tanaka' }]}
          errors={{ receivedOn: 'Equipment cannot be received before it was ordered.' }}
        />
        <output data-testid="value">{JSON.stringify(value)}</output>
      </>
    );
  }

  it('reports ISO dates and the chosen user', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Equipment Ordered On'), {
      target: { value: '08/03/2026' },
    });
    fireEvent.change(screen.getByLabelText('Ordered By'), { target: { value: USER_ID } });
    fireEvent.change(screen.getByLabelText('Equipment Received On'), {
      target: { value: '08/12/2026' },
    });
    expect(JSON.parse(screen.getByTestId('value').textContent ?? '{}')).toEqual({
      orderedOn: '2026-08-03',
      orderedBy: USER_ID,
      receivedOn: '2026-08-12',
    });
  });

  it('shows the errors it is given and honours disabled', () => {
    render(<Harness disabled />);
    expect(
      screen.getByText('Equipment cannot be received before it was ordered.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Equipment Ordered On')).toBeDisabled();
    expect(screen.getByLabelText('Ordered By')).toBeDisabled();
  });
});

/* ------------------------------------------------------------------ */
/* Denial reasons                                                      */
/* ------------------------------------------------------------------ */

describe('MhdAccommodationDenialReasonsField', () => {
  const vocabulary: MhdAccommodationDenialReasonCode[] = [
    {
      code: 'NO_VACANT_POSITION',
      label: 'No vacant position is available',
      sortOrder: 60,
      requiresDetail: true,
      detailPrompt: 'Positions considered',
      requiresAlternative: false,
      alternativePrompt: null,
    },
    {
      code: 'INEFFECTIVE',
      label: 'Accommodation would be ineffective',
      sortOrder: 10,
      requiresDetail: false,
      detailPrompt: null,
      requiresAlternative: false,
      alternativePrompt: null,
    },
  ];

  function Harness({ codes }: { codes: MhdAccommodationDenialReasonCode[] }) {
    const [value, setValue] = useState<MhdAccommodationDenialReasonInput[]>([]);
    return (
      <MhdAccommodationDenialReasonsField value={value} onChange={setValue} vocabulary={codes} />
    );
  }

  it('renders the table vocabulary in sort order', () => {
    render(<Harness codes={vocabulary} />);
    const labels = within(screen.getByRole('group', { name: 'Reasons For The Denial' }))
      .getAllByRole('checkbox')
      .map((checkbox) => checkbox.closest('label')?.textContent);
    expect(labels).toEqual([
      'Accommodation would be ineffective',
      'No vacant position is available',
    ]);
  });

  it('falls back to the constant labels while the vocabulary loads', () => {
    render(<Harness codes={[]} />);
    expect(
      within(screen.getByRole('group', { name: 'Reasons For The Denial' })).getAllByRole(
        'checkbox',
      ),
    ).toHaveLength(MHD_ACCOMMODATION_DENIAL_REASONS.length);
    expect(
      screen.getByLabelText(mhdFormatAccommodationValue('UNDUE_HARDSHIP')),
    ).toBeInTheDocument();
  });

  it('reveals the specifics input with its prompt and an inline error until filled', () => {
    render(<Harness codes={vocabulary} />);
    expect(screen.getByText('Choose at least one reason.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Positions considered')).toBeNull();

    fireEvent.click(screen.getByLabelText('No vacant position is available'));
    expect(screen.getByLabelText('Positions considered')).toBeInTheDocument();
    expect(screen.getByText('Describe the specifics for this reason.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Positions considered'), {
      target: { value: 'Dispatcher and inventory clerk; both filled.' },
    });
    expect(screen.queryByText('Describe the specifics for this reason.')).toBeNull();

    fireEvent.click(screen.getByLabelText('No vacant position is available'));
    expect(screen.queryByLabelText('Positions considered')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Notices                                                             */
/* ------------------------------------------------------------------ */

function template(overrides: Partial<MhdDocumentTemplate>): MhdDocumentTemplate {
  return {
    id: crypto.randomUUID(),
    referenceId: 'DOCT-000101',
    companyId: null,
    name: 'Accommodation Denial Letter',
    templateKey: 'ACCOMMODATION_DENIAL_LETTER',
    templateType: 'REPORT',
    applicableEntityType: 'ACCOMMODATION_CASE',
    description: null,
    contentFormat: 'HTML',
    mergeFields: [],
    version: 3,
    isActive: true,
    requiresSignature: false,
    createdAt: '2026-11-20T00:00:00Z',
    updatedAt: '2026-11-20T00:00:00Z',
    ...overrides,
  };
}

describe('MhdAccommodationNoticesPanel', () => {
  function renderNotices() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MhdAccommodationNoticesPanel caseId={CASE_ID} />
      </QueryClientProvider>,
    );
  }

  it('lists only keyed accommodation templates and records the stable key', async () => {
    const denial = template({});
    const leave = template({
      name: 'Leave Designation Notice',
      templateKey: 'LEAVE_DESIGNATION_NOTICE',
      applicableEntityType: 'LEAVE_CASE',
    });
    const unkeyed = template({ name: 'Ad Hoc Letter', templateKey: null });
    listTemplatesMock.mockResolvedValue([denial, leave, unkeyed]);
    generateMock.mockResolvedValue({ id: 'generation-1' });
    recordNoticeMock.mockResolvedValue('notice-1');
    renderNotices();

    fireEvent.click(screen.getByRole('button', { name: 'New Notice' }));
    await screen.findByRole('option', { name: 'Accommodation Denial Letter (v3)' });
    expect(listTemplatesMock).toHaveBeenCalledWith(
      'company-1',
      undefined,
      false,
      'ACCOMMODATION_CASE',
    );
    expect(screen.queryByRole('option', { name: /Leave Designation Notice/ })).toBeNull();
    expect(screen.queryByRole('option', { name: /Ad Hoc Letter/ })).toBeNull();

    expect(
      within(screen.getByLabelText('Notice Type'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([
      'Request Acknowledgment',
      'Information Request',
      'Interactive Process Meeting',
      'Decision',
      'Denial',
      'Implementation',
      'Follow Up',
    ]);

    fireEvent.change(screen.getByLabelText('Notice Type'), { target: { value: 'DENIAL' } });
    fireEvent.change(screen.getByLabelText('Document Template'), { target: { value: denial.id } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Notice' }));

    await waitFor(() =>
      expect(recordNoticeMock).toHaveBeenCalledWith({
        caseId: CASE_ID,
        noticeType: 'DENIAL',
        templateKey: 'ACCOMMODATION_DENIAL_LETTER',
        templateVersion: 3,
        documentGenerationId: 'generation-1',
      }),
    );
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('opens New Notice as a dialog that saves and resumes the notice type and template', async () => {
    const denial = template({});
    listTemplatesMock.mockResolvedValue([denial]);
    mockDraft.draft = savedDraft({ noticeType: 'DECISION', templateId: denial.id });
    renderNotices();

    const dialog = openForm('New Notice');
    await within(dialog).findByRole('option', { name: 'Accommodation Denial Letter (v3)' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));
    expect(within(dialog).getByLabelText('Notice Type')).toHaveValue('DECISION');
    expect(within(dialog).getByLabelText('Document Template')).toHaveValue(denial.id);

    fireEvent.change(within(dialog).getByLabelText('Notice Type'), {
      target: { value: 'FOLLOW_UP' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() =>
      expect(mockDraft.save).toHaveBeenCalledWith(
        expect.objectContaining({ payload: { noticeType: 'FOLLOW_UP', templateId: denial.id } }),
      ),
    );
  });
});
