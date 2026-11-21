import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/postgrest-js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdAccommodationDetail } from '../Types';

const { rolesRef, detailRef, interactionMock } = vi.hoisted(() => ({
  rolesRef: { current: [] as MhdAuthRoleName[] },
  detailRef: { current: null as unknown },
  interactionMock: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    roles: rolesRef.current,
    profile: { companyId: 'b8e4a1d7-30c5-4f92-8d16-6a2e9f7c1b04', personId: null },
  }),
}));

vi.mock('@/features/tasks/Service', () => ({
  mhdTaskService: { listAssignableUsers: vi.fn().mockResolvedValue([]) },
}));

function mutation(mutateAsync: (input: never) => Promise<unknown>) {
  return { mutateAsync, isPending: false };
}

vi.mock('../Hook', () => ({
  useMhdAccommodationCase: () => ({ data: detailRef.current, isLoading: false }),
  useMhdAccommodationReadiness: () => ({ data: null }),
  useMhdAccommodationTransition: () => mutation(vi.fn()),
  useMhdAccommodationInteraction: () => mutation(interactionMock),
  useMhdAccommodationOption: () => mutation(vi.fn()),
  useMhdAccommodationDecision: () => mutation(vi.fn()),
  useMhdAccommodationRequestDetails: () => mutation(vi.fn()),
  useMhdAccommodationEmployeeCertify: () => mutation(vi.fn()),
  useMhdAccommodationProviderCertification: () => mutation(vi.fn()),
  useMhdAccommodationProviderCertificationReveal: () => ({ ...mutation(vi.fn()), reset: vi.fn() }),
  useMhdAccommodationEquipment: () => mutation(vi.fn()),
  useMhdAccommodationDenialReasonCodes: () => ({ data: [] }),
  useMhdAccommodationImplementation: () => mutation(vi.fn()),
  useMhdAccommodationReview: () => mutation(vi.fn()),
  useMhdAccommodationMedicalRecord: () => mutation(vi.fn()),
  useMhdAccommodationMedicalReveal: () => mutation(vi.fn()),
  useMhdAccommodationOptionCatalog: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
  useMhdAccommodationDocumentTemplates: () => ({
    data: [],
    isLoading: false,
    isError: false,
    error: null,
  }),
}));

const { MhdAccommodationCaseDetailPage } =
  await import('../components/MhdAccommodationCaseDetailPage');

const CASE_ID = crypto.randomUUID();

function bundle(overrides: Partial<MhdAccommodationDetail> = {}): MhdAccommodationDetail {
  return {
    case: {
      id: CASE_ID,
      reference_id: 'RA-0218',
      company_id: 'b8e4a1d7-30c5-4f92-8d16-6a2e9f7c1b04',
      person_id: crypto.randomUUID(),
      recruiting_application_id: null,
      leave_case_id: null,
      job_description_id: null,
      essential_functions: [],
      request_source: 'SELF',
      request_channel: 'VERBAL',
      requested_at: '2026-09-02T16:20:00.000Z',
      request_summary: 'Asked for a sit-stand desk after the floor reorganization.',
      status: 'INTERACTIVE_PROCESS',
      owner_user_id: null,
      closure_reason: null,
    },
    interactions: [],
    options: [],
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
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/accommodations/${CASE_ID}`]}>
        <Routes>
          <Route path="/accommodations/:caseId" element={<MhdAccommodationCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  detailRef.current = bundle();
});

describe('a Client Admin reading an accommodation case with no medical block', () => {
  beforeEach(() => {
    rolesRef.current = ['Client Admin'];
  });

  it('sees the non-medical request details', () => {
    renderPage();
    expect(
      screen.getByText('Asked for a sit-stand desk after the floor reorganization.'),
    ).toBeInTheDocument();
    expect(screen.getByText('RA-0218')).toBeInTheDocument();
  });

  it('has no provider certification tab, record form or reveal control in the DOM', () => {
    renderPage();
    expect(screen.queryByRole('tab', { name: /provider certification/i })).toBeNull();
    expect(screen.queryByText('Record Provider Certification')).toBeNull();
    expect(screen.queryByText(/Reveal Provider And Recommendation/i)).toBeNull();
    expect(screen.queryByText('Record Restricted Medical Status')).toBeNull();
    expect(screen.queryByRole('button', { name: /reveal restricted record/i })).toBeNull();
  });

  it('shows the restricted notice, never a medical status row, on the documentation tab', () => {
    renderPage();
    fireEvent.click(screen.getByRole('tab', { name: /documentation status/i }));
    expect(
      screen.getByText(/Restricted medical content is unavailable to your role/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Provider Note/)).toBeNull();
  });
});

describe('the compliance refusal on an accommodation write', () => {
  it('renders the message of a not-approved-content refusal (55000)', async () => {
    rolesRef.current = ['HR Partner'];
    const refusal = new PostgrestError({
      message: 'Compliance content ACCOMMODATION_ACKNOWLEDGEMENT has not been approved.',
      details: '',
      hint: '',
      code: '55000',
    });
    interactionMock.mockRejectedValue(refusal);
    renderPage();

    fireEvent.change(screen.getByPlaceholderText('What was discussed and understood?'), {
      target: { value: 'Walked through the seating options with the employee.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Interaction' }));

    await waitFor(() => expect(interactionMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(refusal.message)).toBeInTheDocument();
  });
});
