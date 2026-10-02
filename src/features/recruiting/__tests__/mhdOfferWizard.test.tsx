import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const { authRef, applicationRef, salaryCheckRef, createMock, extendMock, signatureMock } =
  vi.hoisted(() => ({
    authRef: { current: { profile: { companyId: 'company-1' }, roles: [] as MhdAuthRoleName[] } },
    applicationRef: { current: null as Record<string, string> | null },
    salaryCheckRef: { current: null as Record<string, unknown> | null },
    createMock: vi.fn(),
    extendMock: vi.fn(),
    signatureMock: vi.fn(),
  }));

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => authRef.current }));
vi.mock('../offers/Hook', () => ({
  useMhdCreateOffer: () => ({ mutateAsync: createMock, isPending: false }),
  useMhdExtendOffer: () => ({ mutateAsync: extendMock, isPending: false }),
  useMhdOfferSalaryCheck: (input: unknown) => ({
    data: input ? salaryCheckRef.current : null,
    isLoading: false,
    isError: false,
    error: null,
  }),
}));
vi.mock('../offers/Service', () => ({
  mhdOfferService: { requestCandidateSignature: signatureMock },
}));
vi.mock('../requisitions/Hook', () => ({
  useMhdRecruitingApplication: () => ({ data: applicationRef.current, isLoading: false }),
  useMhdRecruitingRequisitions: () => ({
    data: [
      {
        id: 'req-1',
        title: 'Senior Analyst',
        employmentType: 'FULL_TIME',
        hiringManagerPersonId: 'manager-1',
      },
    ],
  }),
  useMhdRecruitingPeople: () => ({ data: [{ id: 'manager-1', displayName: 'Morgan Lee' }] }),
}));
vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: (props: {
    templateKey: string;
    entityType: string;
    entityId: string;
    onResolved?: (outcome: {
      outcome: 'GENERATED';
      generationId: string;
      esignatureRequestId: string | null;
      documentHash: string;
      queueId: string;
      outputDriveFileId: string | null;
    }) => void;
    signing?: {
      createRequest: (generated: {
        generationId: string;
        documentHash: string;
      }) => Promise<unknown>;
    };
  }) => (
    <div>
      <p>{`Document step: ${props.templateKey} for ${props.entityType} ${props.entityId}`}</p>
      <button
        onClick={() =>
          props.onResolved?.({
            outcome: 'GENERATED',
            generationId: 'generation-1',
            esignatureRequestId: 'signature-1',
            documentHash: 'hash-1',
            queueId: 'queue-1',
            outputDriveFileId: null,
          })
        }
      >
        Simulate Generated
      </button>
      <button
        onClick={() =>
          props.signing
            ?.createRequest({ generationId: 'generation-1', documentHash: 'hash-1' })
            .then(() => undefined)
        }
      >
        Simulate Signing
      </button>
    </div>
  ),
}));

const { MhdOfferWizard } = await import('../offers/components/MhdOfferWizard');

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/recruiting/applications/app-1/offer/new']}>
      <Routes>
        <Route path="/recruiting/applications/:appId/offer/new" element={<MhdOfferWizard />} />
        <Route path="/recruiting/applications/:appId/offer" element={<p>Offer page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function next() {
  fireEvent.click(screen.getByRole('button', { name: /next|continue|submit|finish/i }));
}

function fillRequiredSteps() {
  next();
  next();
  next();
}

beforeEach(() => {
  vi.clearAllMocks();
  authRef.current = { profile: { companyId: 'company-1' }, roles: ['HR Partner'] };
  applicationRef.current = {
    id: 'app-1',
    requisitionId: 'req-1',
    requisitionTitle: 'Senior Analyst',
    personId: 'person-1',
    personDisplayName: 'Avery Chen',
  };
  salaryCheckRef.current = {
    checked: true,
    flsaClassification: 'EXEMPT',
    annualizedPay: 83200,
    annualizationBasis: 'FULL_TIME_2080_HOURS',
    blocking: [],
    advisory: [{ code: 'NOTE', message: 'Pay is above the midpoint.' }],
  };
  createMock.mockResolvedValue({ id: 'offer-1', referenceId: 'OFR-2026-0001' });
  extendMock.mockResolvedValue(undefined);
  signatureMock.mockResolvedValue({ requestId: 'signature-1', invitationErrors: [] });
});

describe('MhdOfferWizard', () => {
  it('walks the wizard once, creates the exact draft, and opens the offer', async () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '11/02/2026' } });
    next();
    fireEvent.change(screen.getByLabelText('Base pay'), { target: { value: '4000' } });
    fireEvent.change(screen.getByLabelText('Pay frequency'), { target: { value: 'MONTHLY' } });
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: /create|submit|finish/i }));
    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock).toHaveBeenCalledWith({
      applicationId: 'app-1',
      jobTitle: 'Senior Analyst',
      startDate: '2026-11-02',
      baseSalary: 4000,
      payFrequency: 'MONTHLY',
      employmentType: 'FULL_TIME',
      reportingManagerPersonId: 'manager-1',
      offerExpirationDate: null,
      requiresApproval: false,
      salaryOverrideReason: null,
    });
    expect(screen.getByText('Offer Created')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Offer' }));
    expect(await screen.findByText('Offer page')).toBeInTheDocument();
  });

  it('validates a blank title and keeps requisition defaults until overtyped', () => {
    renderWizard();
    expect(screen.getByLabelText('Job title')).toHaveValue('Senior Analyst');
    expect(screen.getByLabelText('Employment type')).toHaveValue('FULL_TIME');
    expect(screen.getByLabelText('Reporting manager')).toHaveValue('manager-1');
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Custom Analyst' } });
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: '' } });
    next();
    expect(screen.getByRole('alert')).toHaveTextContent('A job title is required.');
  });

  it('checks pay only with both inputs and renders the annualized basis and advisory', () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '11/02/2026' } });
    next();
    expect(screen.getByText(/No pay entered/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Base pay'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('Pay frequency'), { target: { value: 'HOURLY' } });
    expect(screen.getByText(/2,080-hour year/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('midpoint');
  });

  it('rejects past and pre-start expiration dates', async () => {
    const iso = (offsetDays: number) => {
      const date = new Date();
      date.setDate(date.getDate() + offsetDays);
      return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    };
    renderWizard();
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: iso(30) } });
    next();
    next();
    const message = 'The expiration date cannot be before today or the start date.';
    fireEvent.change(screen.getByLabelText('Offer expiration date'), {
      target: { value: iso(-3) },
    });
    next();
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    fireEvent.change(screen.getByLabelText('Offer expiration date'), {
      target: { value: iso(10) },
    });
    next();
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    fireEvent.change(screen.getByLabelText('Offer expiration date'), {
      target: { value: iso(40) },
    });
    next();
    await waitFor(() => expect(screen.getByText(/Candidate:/)).toBeInTheDocument());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('requires and sends a reason for blocking pay findings', async () => {
    salaryCheckRef.current = {
      ...salaryCheckRef.current,
      blocking: [{ code: 'RANGE', message: 'Pay is outside the posted range.' }],
    };
    renderWizard();
    next();
    fireEvent.change(screen.getByLabelText('Base pay'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Pay frequency'), { target: { value: 'ANNUAL' } });
    next();
    const alertText = screen
      .getAllByRole('alert')
      .map((element) => element.textContent)
      .join(' ');
    expect(alertText).toContain('outside the posted range');
    expect(alertText).toContain('Record why to proceed');
    fireEvent.change(screen.getByLabelText(/Why to proceed/), {
      target: { value: 'Market exception approved.' },
    });
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: /create|submit|finish/i }));
    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({ salaryOverrideReason: 'Market exception approved.' }),
      ),
    );
  });

  it('extends with generated ids or nulls, delegates signing, and shows failure', async () => {
    renderWizard();
    fillRequiredSteps();
    fireEvent.click(screen.getByRole('button', { name: /create|submit|finish/i }));
    await screen.findByText('Offer Created');
    fireEvent.click(screen.getByRole('button', { name: 'Simulate Signing' }));
    await waitFor(() =>
      expect(signatureMock).toHaveBeenCalledWith({
        companyId: 'company-1',
        personId: 'person-1',
        generationId: 'generation-1',
        documentHash: 'hash-1',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Simulate Generated' }));
    fireEvent.click(screen.getByRole('button', { name: 'Extend Offer To Candidate' }));
    await waitFor(() =>
      expect(extendMock).toHaveBeenCalledWith({
        offerId: 'offer-1',
        documentGenerationId: 'generation-1',
        esignatureRequestId: 'signature-1',
      }),
    );
    expect(screen.getByRole('status')).toHaveTextContent('extended to the candidate');
    expect(screen.getByRole('button', { name: 'Extend Without A Letter' })).toBeDisabled();
  });

  it('shows a create refusal on review and retries successfully', async () => {
    createMock
      .mockRejectedValueOnce(new Error('The job title is not valid for this requisition.'))
      .mockResolvedValueOnce({ id: 'offer-1', referenceId: 'OFR-2026-0001' });
    renderWizard();
    fillRequiredSteps();
    fireEvent.click(screen.getByRole('button', { name: /create|submit|finish/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The job title is not valid');
    fireEvent.click(screen.getByRole('button', { name: /create|submit|finish/i }));
    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText('Offer Created')).toBeInTheDocument();
  });

  it('hides the letter step for a role that cannot issue offer documents', async () => {
    authRef.current.roles = ['Manager'];
    renderWizard();
    fillRequiredSteps();
    fireEvent.click(screen.getByRole('button', { name: /create|submit|finish/i }));
    await screen.findByText('Offer Created');
    expect(screen.queryByText(/Document step:/)).not.toBeInTheDocument();
    expect(screen.getByText('Your role cannot generate the offer letter.')).toBeInTheDocument();
  });

  it('extends without a letter with null ids and keeps the action available after failure', async () => {
    extendMock.mockRejectedValueOnce(
      new Error('The offer is blocked by the pre-live compliance review gate.'),
    );
    renderWizard();
    fillRequiredSteps();
    fireEvent.click(screen.getByRole('button', { name: /create|submit|finish/i }));
    await screen.findByText('Offer Created');
    fireEvent.click(screen.getByRole('button', { name: 'Extend Without A Letter' }));
    await waitFor(() =>
      expect(extendMock).toHaveBeenCalledWith({
        offerId: 'offer-1',
        documentGenerationId: null,
        esignatureRequestId: null,
      }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('pre-live compliance review gate');
    expect(screen.getByRole('button', { name: 'Extend Without A Letter' })).toBeEnabled();
  });
});
