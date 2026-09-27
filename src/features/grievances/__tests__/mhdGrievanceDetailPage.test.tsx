import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { MhdGrievanceDetail } from '../Types';

const { detailMock, stepsMock, acknowledgeMock, referMock, resolveMock, rejectMock, addStepMock } = vi.hoisted(() => ({
  detailMock: vi.fn(),
  stepsMock: vi.fn(),
  acknowledgeMock: vi.fn().mockResolvedValue(undefined),
  referMock: vi.fn().mockResolvedValue(undefined),
  resolveMock: vi.fn().mockResolvedValue(undefined),
  rejectMock: vi.fn().mockResolvedValue(undefined),
  addStepMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../Hook', () => ({
  useMhdGrievance: detailMock,
  useMhdGrievanceSteps: stepsMock,
  useMhdAcknowledgeGrievance: () => ({ mutateAsync: acknowledgeMock, isPending: false }),
  useMhdReferGrievance: () => ({ mutateAsync: referMock, isPending: false }),
  useMhdResolveGrievance: () => ({ mutateAsync: resolveMock, isPending: false }),
  useMhdRejectGrievance: () => ({ mutateAsync: rejectMock, isPending: false }),
  useMhdAddGrievanceStep: () => ({ mutateAsync: addStepMock, isPending: false }),
}));

const { MhdGrievanceDetailPage } = await import('../components/MhdGrievanceDetailPage');

function detail(overrides: Partial<MhdGrievanceDetail>): MhdGrievanceDetail {
  return {
    id: 'g1',
    referenceId: 'GRV-000001',
    companyId: 'company-1',
    personId: 'person-1',
    status: 'SUBMITTED',
    grievanceWho: null,
    grievanceWhat: 'What happened',
    grievanceWhere: null,
    grievanceWhen: null,
    grievanceWhy: null,
    disagreementExplanation: 'Why I disagree',
    remedyRequested: 'The remedy',
    concernsUnrecordedOralReprimand: false,
    isHarassmentRelated: false,
    referredToProcess: null,
    referredAt: null,
    submittedAt: '2026-09-01T00:00:00Z',
    employeeSignatureName: 'Dana Doe',
    employeeSignatureAt: '2026-09-01T00:00:00Z',
    acknowledgedAt: null,
    resolution: null,
    resolutionAt: null,
    closedAt: null,
    ...overrides,
  };
}

function renderAt(grievanceId: string) {
  return render(
    <MemoryRouter initialEntries={[`/grievances/${grievanceId}`]}>
      <Routes>
        <Route path="/grievances/:grievanceId" element={<MhdGrievanceDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MhdGrievanceDetailPage', () => {
  it('offers Acknowledge for a freshly submitted grievance', () => {
    detailMock.mockReturnValue({ data: detail({}), isLoading: false, error: null });
    stepsMock.mockReturnValue({ data: [], isLoading: false });
    renderAt('g1');

    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeInTheDocument();
  });

  it('hides Acknowledge once already acknowledged, but keeps the other review actions', () => {
    detailMock.mockReturnValue({ data: detail({ status: 'ACKNOWLEDGED', acknowledgedAt: '2026-09-02T00:00:00Z' }), isLoading: false, error: null });
    stepsMock.mockReturnValue({ data: [], isLoading: false });
    renderAt('g1');

    expect(screen.queryByRole('button', { name: 'Acknowledge' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Record Step' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refer' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolve' })).toBeInTheDocument();
  });

  it('shows no action at all for a closed (resolved) grievance', () => {
    detailMock.mockReturnValue({ data: detail({ status: 'RESOLVED', resolution: 'Resolved amicably', resolutionAt: '2026-09-05T00:00:00Z', closedAt: '2026-09-05T00:00:00Z' }), isLoading: false, error: null });
    stepsMock.mockReturnValue({ data: [], isLoading: false });
    renderAt('g1');

    expect(screen.queryByRole('button', { name: 'Acknowledge' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Resolve' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Reject/ })).toBeNull();
    expect(screen.getByText('This grievance is closed. No further action is available.')).toBeInTheDocument();
    expect(screen.getByText('Resolved amicably')).toBeInTheDocument();
  });

  it('records a review step through the modal form', async () => {
    detailMock.mockReturnValue({ data: detail({ status: 'ACKNOWLEDGED' }), isLoading: false, error: null });
    stepsMock.mockReturnValue({ data: [], isLoading: false });
    renderAt('g1');

    await userEvent.click(screen.getByRole('button', { name: 'Record Step' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Step name'), 'Met with supervisor');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Record Step' }));

    expect(addStepMock).toHaveBeenCalledWith(expect.objectContaining({
      grievanceId: 'g1',
      stepName: 'Met with supervisor',
    }));
  });

  it('shows the friendly empty-field message on Refer rather than being blocked by native validation', async () => {
    detailMock.mockReturnValue({ data: detail({ status: 'ACKNOWLEDGED' }), isLoading: false, error: null });
    stepsMock.mockReturnValue({ data: [], isLoading: false });
    renderAt('g1');

    await userEvent.click(screen.getByRole('button', { name: 'Refer' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refer Grievance' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('State the process this is being referred to.');
    expect(referMock).not.toHaveBeenCalled();
  });
});
