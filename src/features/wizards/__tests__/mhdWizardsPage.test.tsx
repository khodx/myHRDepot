import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const { mockUseMhdAuth } = vi.hoisted(() => ({
  mockUseMhdAuth: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

const { MhdWizardsPage } = await import('../components/MhdWizardsPage');

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({ profile: { companyId: 'company-1' }, roles });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MhdWizardsPage', () => {
  it('lists every wizard for a fully privileged role', () => {
    mockAuth(['Platform Admin']);
    render(
      <MemoryRouter>
        <MhdWizardsPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Job Description Wizard/ })).toHaveAttribute(
      'href',
      '/jobs/new',
    );
    expect(screen.getByRole('link', { name: /Leave Intake Wizard/ })).toHaveAttribute(
      'href',
      '/leaves/new/intake',
    );
    expect(screen.getByRole('link', { name: /Compensation Classification Wizard/ })).toHaveAttribute(
      'href',
      '/compensation',
    );
    expect(screen.getByRole('link', { name: /Contractor Classification Wizard/ })).toHaveAttribute(
      'href',
      '/contractor-classification',
    );
    expect(screen.getByRole('link', { name: /Course\/Curriculum\/Program Wizard/ })).toHaveAttribute(
      'href',
      '/training',
    );
  });

  it('hides a wizard card the viewer cannot actually open', () => {
    // Compensation and Contractor Classification are gated to
    // Platform Admin/HR Partner/HR Admin only; Director can reach the hub
    // (broader union) but must not see cards it would then be refused on.
    mockAuth(['Director']);
    render(
      <MemoryRouter>
        <MhdWizardsPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Job Description Wizard/ })).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Compensation Classification Wizard/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Contractor Classification Wizard/ }),
    ).not.toBeInTheDocument();
  });

  it('shows an empty-state message when no wizard matches the viewer role', () => {
    mockAuth(['Viewer']);
    render(
      <MemoryRouter>
        <MhdWizardsPage />
      </MemoryRouter>,
    );
    expect(screen.getByText(/No wizards are available/)).toBeInTheDocument();
  });
});
