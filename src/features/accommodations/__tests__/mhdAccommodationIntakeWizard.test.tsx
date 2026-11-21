import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const SELF_PERSON_ID = '5f3c8a52-6d1e-4c0b-9a7e-2b64d1f0a9c3';
const OTHER_PERSON_ID = 'c1a4e7b9-3f52-48d6-8b0a-71e9d2c5f4a8';
const NEW_CASE_ID = '9d2e6b14-a7c3-4f58-b1e0-3c8a5d7f2e46';

const { authRef, createMock, detailsMock } = vi.hoisted(() => ({
  authRef: {
    current: { profile: null, roles: [] } as {
      profile: { companyId: string; personId: string | null } | null;
      roles: MhdAuthRoleName[];
    },
  },
  createMock: vi.fn(),
  detailsMock: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => authRef.current,
}));

vi.mock('../Hook', () => ({
  useMhdAccommodationPeople: () => ({
    data: [{ id: OTHER_PERSON_ID, firstName: 'Priya', lastName: 'Raman' }],
  }),
  useMhdAccommodationReadiness: () => ({ data: undefined }),
  useMhdCreateAccommodation: () => ({ mutateAsync: createMock, isPending: false }),
  useMhdAccommodationRequestDetails: () => ({ mutateAsync: detailsMock, isPending: false }),
}));

const { MhdAccommodationIntakeWizard } = await import('../components/MhdAccommodationIntakeWizard');

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/accommodations/new']}>
      <Routes>
        <Route path="/accommodations/new" element={<MhdAccommodationIntakeWizard />} />
        <Route path="/accommodations/:caseId" element={<p>Case opened</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function clickNext() {
  fireEvent.click(screen.getByRole('button', { name: /next|continue|submit|finish/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  createMock.mockResolvedValue({ id: NEW_CASE_ID, referenceId: 'ACC-2026-0007' });
  detailsMock.mockResolvedValue(NEW_CASE_ID);
});

describe('MhdAccommodationIntakeWizard', () => {
  it('lets a privileged role pick the subject person and opens the case', async () => {
    authRef.current = {
      profile: { companyId: 'company-a', personId: SELF_PERSON_ID },
      roles: ['HR Partner'],
    };
    renderWizard();

    clickNext();
    expect(screen.getByRole('alert')).toHaveTextContent('Choose a person.');

    fireEvent.change(screen.getByLabelText('Person'), { target: { value: OTHER_PERSON_ID } });
    clickNext();
    clickNext(); // origin step keeps its defaults: self / verbal

    fireEvent.change(screen.getByLabelText(/Requested workplace change/), {
      target: { value: 'Later start time so the morning commute is manageable.' },
    });
    clickNext();
    clickNext(); // Section A basics keep their defaults

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toMatchObject({
      companyId: 'company-a',
      personId: OTHER_PERSON_ID,
      requestSource: 'SELF',
      requestChannel: 'VERBAL',
      requestSummary: 'Later start time so the morning commute is manageable.',
    });
    expect(await screen.findByText('Case opened')).toBeInTheDocument();
  });

  it("opens a self-service request for the caller's own person record only", async () => {
    authRef.current = {
      profile: { companyId: 'company-a', personId: SELF_PERSON_ID },
      roles: ['Employee'],
    };
    renderWizard();

    expect(screen.queryByLabelText('Person')).not.toBeInTheDocument();
    clickNext();
    clickNext();
    fireEvent.change(screen.getByLabelText(/Requested workplace change/), {
      target: { value: 'A sit-stand desk for my workstation.' },
    });
    clickNext();
    clickNext(); // Section A basics keep their defaults

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0].personId).toBe(SELF_PERSON_ID);
  });

  it('refuses a self-service request when the account has no person record', () => {
    authRef.current = {
      profile: { companyId: 'company-a', personId: null },
      roles: ['Employee'],
    };
    renderWizard();
    clickNext();
    expect(screen.getByRole('alert')).toHaveTextContent(/not linked to a person record/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejects diagnosis language in the request summary and never calls the RPC', () => {
    authRef.current = {
      profile: { companyId: 'company-a', personId: SELF_PERSON_ID },
      roles: ['Employee'],
    };
    renderWizard();
    clickNext();
    clickNext();
    fireEvent.change(screen.getByLabelText(/Requested workplace change/), {
      target: { value: 'My diagnosis requires a quieter room.' },
    });
    clickNext();
    expect(screen.getByRole('alert')).toHaveTextContent(/Do not enter a diagnosis/);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('saves the Section A basics on the new case after it is created', async () => {
    authRef.current = {
      profile: { companyId: 'company-a', personId: SELF_PERSON_ID },
      roles: ['Employee'],
    };
    renderWizard();
    clickNext();
    clickNext();
    fireEvent.change(screen.getByLabelText(/Requested workplace change/), {
      target: { value: 'A sit-stand desk for my workstation.' },
    });
    clickNext();

    fireEvent.click(screen.getByLabelText('Temporary'));
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Leave Requested' })).getByLabelText('Yes'),
    );
    clickNext();
    expect(screen.getByRole('alert')).toHaveTextContent('Say what leave was requested and when.');
    fireEvent.change(screen.getByLabelText('Leave Request Details'), {
      target: { value: 'Two weeks off from September 1 while the desk is installed.' },
    });
    clickNext();

    await waitFor(() => expect(detailsMock).toHaveBeenCalledTimes(1));
    expect(detailsMock).toHaveBeenCalledWith({
      caseId: NEW_CASE_ID,
      limitationDuration: 'TEMPORARY',
      workersCompClaim: false,
      leaveRequested: true,
      leaveRequestDetails: 'Two weeks off from September 1 while the desk is installed.',
    });
    expect(createMock.mock.invocationCallOrder[0]).toBeLessThan(
      detailsMock.mock.invocationCallOrder[0],
    );
    expect(await screen.findByText('Case opened')).toBeInTheDocument();
  });

  it('screens the leave details for prohibited medical detail before anything is created', () => {
    authRef.current = {
      profile: { companyId: 'company-a', personId: SELF_PERSON_ID },
      roles: ['Employee'],
    };
    renderWizard();
    clickNext();
    clickNext();
    fireEvent.change(screen.getByLabelText(/Requested workplace change/), {
      target: { value: 'A sit-stand desk for my workstation.' },
    });
    clickNext();
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Leave Requested' })).getByLabelText('Yes'),
    );
    fireEvent.change(screen.getByLabelText('Leave Request Details'), {
      target: { value: 'Leave while my genetic testing results are reviewed.' },
    });
    clickNext();

    expect(screen.getByRole('alert')).toHaveTextContent(/Do not enter a diagnosis/);
    expect(createMock).not.toHaveBeenCalled();
    expect(detailsMock).not.toHaveBeenCalled();
  });

  it('keeps the person on the wizard with a way to the case when Section A fails to save', async () => {
    detailsMock.mockRejectedValue(new Error('The employee has certified this request'));
    authRef.current = {
      profile: { companyId: 'company-a', personId: SELF_PERSON_ID },
      roles: ['Employee'],
    };
    renderWizard();
    clickNext();
    clickNext();
    fireEvent.change(screen.getByLabelText(/Requested workplace change/), {
      target: { value: 'A sit-stand desk for my workstation.' },
    });
    clickNext();
    clickNext();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Request ACC-2026-0007 was opened, but its request details were not saved: The employee has certified this request.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open Request' }));
    expect(await screen.findByText('Case opened')).toBeInTheDocument();
  });
});
