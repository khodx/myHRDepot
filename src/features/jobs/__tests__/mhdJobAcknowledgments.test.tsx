import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock, invokeMock } = vi.hoisted(() => ({ rpcMock: vi.fn(), invokeMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock, functions: { invoke: invokeMock } },
}));
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { personId: 'person-1', companyId: 'company-1' } }),
}));

const { mhdJobsService } = await import('../Service');
const { MhdMyJobPage } = await import('../components/MhdMyJobPage');
const { MhdJobAcknowledgmentBoard } = await import('../components/MhdJobAcknowledgmentBoard');

const pendingRow = {
  acknowledgment_id: 'ack-1',
  description_id: 'desc-1',
  job_id: 'job-1',
  job_title: 'Line Cook',
  version_number: '3',
  effective_from: '2026-10-01',
  status: 'PENDING',
  assigned_at: '2026-10-01T09:00:00Z',
  acknowledged_at: null,
  signed_name: null,
};

const publishedRow = {
  job_id: 'job-1',
  job_title: 'Line Cook',
  flsa_classification: 'NON_EXEMPT',
  is_safety_sensitive: false,
  industry: 'GENERAL',
  description_id: 'desc-1',
  description_reference: 'JD-000001',
  version_number: 3,
  effective_from: '2026-10-01',
  summary: 'Prepares food.',
  essential_functions: [],
  marginal_functions: [],
  qualifications: [],
  competencies: [],
};

function routeRpc(overrides: Record<string, unknown>) {
  rpcMock.mockImplementation(async (name: string) => {
    if (name in overrides) {
      const value = overrides[name];
      if (value instanceof Error) return { data: null, error: value };
      return { data: value, error: null };
    }
    return { data: null, error: null };
  });
}

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return { invalidate };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdJobsService acknowledgments', () => {
  it('maps my acknowledgments to camelCase with a numeric version', async () => {
    routeRpc({ mhd_job_description_my_acknowledgments: [pendingRow] });
    const rows = await mhdJobsService.listMyAcknowledgments();
    expect(rows).toEqual([
      {
        acknowledgmentId: 'ack-1',
        descriptionId: 'desc-1',
        jobId: 'job-1',
        jobTitle: 'Line Cook',
        versionNumber: 3,
        effectiveFrom: '2026-10-01',
        status: 'PENDING',
        assignedAt: '2026-10-01T09:00:00Z',
        acknowledgedAt: null,
        signedName: null,
      },
    ]);
  });

  it('sends the trimmed typed name and propagates a server refusal', async () => {
    routeRpc({ mhd_job_description_acknowledge: null });
    await mhdJobsService.acknowledgeDescription({
      acknowledgmentId: 'ack-1',
      signedName: '  Dana Whitfield ',
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_job_description_acknowledge', {
      p_acknowledgment_id: 'ack-1',
      p_signed_name: 'Dana Whitfield',
    });

    const refusal = new Error('already acknowledged');
    routeRpc({ mhd_job_description_acknowledge: refusal });
    await expect(
      mhdJobsService.acknowledgeDescription({ acknowledgmentId: 'ack-1', signedName: 'Dana W' }),
    ).rejects.toBe(refusal);
  });

  it('maps ack status rows and propagates a refusal', async () => {
    routeRpc({
      mhd_job_description_ack_status: [
        {
          acknowledgment_id: 'ack-1',
          person_id: 'person-1',
          person_name: 'Dana Whitfield',
          status: 'PENDING',
          assigned_at: '2026-10-01T09:00:00Z',
          acknowledged_at: null,
        },
      ],
    });
    const rows = await mhdJobsService.listAcknowledgmentStatus('desc-1');
    expect(rows[0]).toMatchObject({ personName: 'Dana Whitfield', status: 'PENDING' });

    const refusal = new Error('insufficient_privilege');
    routeRpc({ mhd_job_description_ack_status: refusal });
    await expect(mhdJobsService.listAcknowledgmentStatus('desc-1')).rejects.toBe(refusal);
  });
});

describe('MhdMyJobPage acknowledgment', () => {
  it('validates the typed name, records it, and invalidates the badge query', async () => {
    routeRpc({
      mhd_job_get_published_for_person: [publishedRow],
      mhd_job_description_my_acknowledgments: [pendingRow],
      mhd_job_description_acknowledge: null,
    });
    const { invalidate } = renderWithClient(<MhdMyJobPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Acknowledge' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'D' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Acknowledgment' }));

    expect(await screen.findByText(/at least 2 characters/)).toBeInTheDocument();
    expect(rpcMock).not.toHaveBeenCalledWith('mhd_job_description_acknowledge', expect.anything());

    // After a successful call the refetch returns the acknowledged state.
    routeRpc({
      mhd_job_get_published_for_person: [publishedRow],
      mhd_job_description_my_acknowledgments: [
        {
          ...pendingRow,
          status: 'ACKNOWLEDGED',
          acknowledged_at: '2026-10-05T12:00:00Z',
          signed_name: 'Dana Whitfield',
        },
      ],
      mhd_job_description_acknowledge: null,
    });
    fireEvent.change(screen.getByLabelText('Full name'), {
      target: { value: 'Dana Whitfield' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Record Acknowledgment' }));

    await waitFor(() =>
      expect(rpcMock).toHaveBeenCalledWith('mhd_job_description_acknowledge', {
        p_acknowledgment_id: 'ack-1',
        p_signed_name: 'Dana Whitfield',
      }),
    );
    expect(await screen.findByText(/Acknowledged on/)).toHaveTextContent('Dana Whitfield');
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['mhd-module-alerts'] });
  });

  it('surfaces a pending acknowledgment for a different version with its own label', async () => {
    routeRpc({
      mhd_job_get_published_for_person: [publishedRow],
      mhd_job_description_my_acknowledgments: [
        { ...pendingRow, acknowledgment_id: 'ack-2', description_id: 'desc-2', version_number: 4 },
      ],
    });
    renderWithClient(<MhdMyJobPage />);
    expect(await screen.findByText(/Version 4/)).toBeInTheDocument();
    expect(screen.getByText(/different version/)).toBeInTheDocument();
  });

  it('shows the server message when acknowledging fails', async () => {
    routeRpc({
      mhd_job_get_published_for_person: [publishedRow],
      mhd_job_description_my_acknowledgments: [pendingRow],
      mhd_job_description_acknowledge: new Error('already acknowledged'),
    });
    renderWithClient(<MhdMyJobPage />);
    fireEvent.click(await screen.findByRole('button', { name: 'Acknowledge' }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Dana Whitfield' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Acknowledgment' }));
    expect(await screen.findByText('already acknowledged')).toBeInTheDocument();
  });
});

describe('MhdJobAcknowledgmentBoard', () => {
  it('shows counts with pending people first', async () => {
    routeRpc({
      mhd_job_description_ack_status: [
        {
          acknowledgment_id: 'a',
          person_id: 'p1',
          person_name: 'Alma Ortega',
          status: 'ACKNOWLEDGED',
          assigned_at: '2026-10-01T09:00:00Z',
          acknowledged_at: '2026-10-02T09:00:00Z',
        },
        {
          acknowledgment_id: 'b',
          person_id: 'p2',
          person_name: 'Ben Okafor',
          status: 'PENDING',
          assigned_at: '2026-10-01T09:00:00Z',
          acknowledged_at: null,
        },
      ],
    });
    renderWithClient(<MhdJobAcknowledgmentBoard descriptionId="desc-1" />);
    expect(await screen.findByText('1 acknowledged · 1 pending')).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Ben Okafor');
    expect(rows[2]).toHaveTextContent('Alma Ortega');
  });

  it('renders nothing when the RPC refuses access', async () => {
    routeRpc({ mhd_job_description_ack_status: new Error('42501') });
    renderWithClient(
      <div data-testid="host">
        <MhdJobAcknowledgmentBoard descriptionId="desc-1" />
      </div>,
    );
    await waitFor(() => expect(rpcMock).toHaveBeenCalled());
    await waitFor(() =>
      expect(screen.queryByText(/Loading acknowledgments/)).not.toBeInTheDocument(),
    );
    expect(screen.getByTestId('host')).toBeEmptyDOMElement();
  });
});
