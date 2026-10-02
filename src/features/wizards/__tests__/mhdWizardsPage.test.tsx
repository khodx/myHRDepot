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
    expect(screen.getByRole('link', { name: /Handbook Wizard/ })).toHaveAttribute(
      'href',
      '/handbooks/new',
    );
    expect(screen.getByRole('link', { name: /Accommodation Intake Wizard/ })).toHaveAttribute(
      'href',
      '/accommodations/new',
    );
  });

  it('lists a hub card for every *Wizard component in the codebase', () => {
    // Guard against a wizard being built and never surfaced here. A wizard
    // component that is deliberately embedded in another wizard (not its own
    // entry point) belongs in EMBEDDED with the reason.
    const EMBEDDED = new Set(['MhdTrainingContentWizard']); // step inside the Course/Curriculum/Program wizard
    const HUB_COMPONENTS: Record<string, string> = {
      MhdJobDescriptionWizard: 'Job Description Wizard',
      MhdLeaveIntakeWizard: 'Leave Intake Wizard',
      MhdCompensationClassificationWizard: 'Compensation Classification Wizard',
      MhdContractorClassificationWizard: 'Contractor Classification Wizard',
      MhdHandbookWizard: 'Handbook Wizard',
      MhdAccommodationIntakeWizard: 'Accommodation Intake Wizard',
      MhdConductIntakeWizard: 'Conduct Intake Wizard',
      MhdInvestigationIntakeWizard: 'Investigation Intake Wizard',
      MhdOffboardingWizard: 'Offboarding Wizard',
      MhdOnboardingWizard: 'Onboarding Wizard',
      MhdRequisitionWizard: 'Requisition Wizard',
      MhdOfferWizard: 'Offer Wizard',
    };
    const found = Object.keys(import.meta.glob('/src/features/**/components/*Wizard.tsx')).map(
      (path) => path.split('/').pop()!.replace('.tsx', ''),
    );
    expect(found.length).toBeGreaterThan(0);
    for (const component of found) {
      if (EMBEDDED.has(component)) continue;
      expect(HUB_COMPONENTS, `${component} has no Wizards hub card`).toHaveProperty(component);
    }

    mockAuth(['Platform Admin']);
    render(
      <MemoryRouter>
        <MhdWizardsPage />
      </MemoryRouter>,
    );
    for (const label of Object.values(HUB_COMPONENTS)) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toBeInTheDocument();
    }
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
