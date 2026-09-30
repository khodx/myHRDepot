import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const HANDBOOK_ID = '2b7e9c41-d6a8-4f13-a05e-8c3d1b9f7e62';
const ESTABLISHMENT_ID = 'e0a1b2c3-d4e5-4f60-8172-93a4b5c6d7e8';

const { authRef, createMock } = vi.hoisted(() => ({
  authRef: {
    current: { profile: { companyId: 'company-a' }, roles: [] } as {
      profile: { companyId: string } | null;
      roles: MhdAuthRoleName[];
    },
  },
  createMock: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => authRef.current,
}));

vi.mock('../Hook', () => ({
  useMhdCreateHandbook: () => ({ mutateAsync: createMock, isPending: false }),
  useMhdHandbookSafetyJurisdictions: () => ({ data: [] }),
  useMhdHandbooks: () => ({ data: [], isLoading: false }),
}));

const { MhdHandbookNewPage } = await import('../components/MhdHandbookNewPage');
const { MhdHandbooksPage } = await import('../components/MhdHandbooksPage');

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/handbooks" element={<MhdHandbooksPage />} />
        <Route path="/handbooks/new" element={<MhdHandbookNewPage />} />
        <Route path="/handbooks/:handbookId" element={<p>Wizard opened</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  createMock.mockResolvedValue({ id: HANDBOOK_ID });
});

describe('MhdHandbookNewPage', () => {
  it('creates the draft and opens the wizard for a privileged role', async () => {
    authRef.current = { profile: { companyId: 'company-a' }, roles: ['HR Partner'] };
    renderAt('/handbooks/new');

    fireEvent.change(screen.getByLabelText('Title'), {
      target: { value: '2026 Employee Handbook' },
    });
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Create draft' }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    expect(createMock.mock.calls[0][0]).toMatchObject({
      companyId: 'company-a',
      handbookType: 'EMPLOYEE',
      title: '2026 Employee Handbook',
    });
    expect(await screen.findByText('Wizard opened')).toBeInTheDocument();
  });

  it('does not offer creation to a role that cannot manage handbooks', () => {
    authRef.current = { profile: { companyId: 'company-a' }, roles: ['Employee'] };
    renderAt('/handbooks/new');
    expect(screen.getByText(/cannot create handbooks/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create draft' })).not.toBeInTheDocument();
  });

  it('forwards the Workplace Safety cross-link to the wizard and pre-selects SAFETY', () => {
    authRef.current = { profile: { companyId: 'company-a' }, roles: ['HR Partner'] };
    renderAt(`/handbooks?handbookType=SAFETY&establishmentId=${ESTABLISHMENT_ID}`);
    expect(screen.getByLabelText('Handbook type')).toHaveValue('SAFETY');
  });
});
