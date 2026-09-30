import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const SELF_PERSON_ID = '5f3c8a52-6d1e-4c0b-9a7e-2b64d1f0a9c3';
const OTHER_PERSON_ID = 'c1a4e7b9-3f52-48d6-8b0a-71e9d2c5f4a8';
const NEW_CASE_ID = '9d2e6b14-a7c3-4f58-b1e0-3c8a5d7f2e46';

const { authRef, createMock } = vi.hoisted(() => ({
  authRef: {
    current: { profile: null, roles: [] } as {
      profile: { companyId: string; personId: string | null } | null;
      roles: MhdAuthRoleName[];
    },
  },
  createMock: vi.fn(),
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
}));

const { MhdAccommodationIntakeWizard } = await import(
  '../components/MhdAccommodationIntakeWizard'
);

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
});
