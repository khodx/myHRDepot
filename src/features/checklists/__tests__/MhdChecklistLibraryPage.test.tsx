import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    profile: { companyId: 'company-1' },
    roles: ['Client Admin'],
  }),
}));

vi.mock('../Hook', () => ({
  useMhdChecklistLibrary: () => ({
    isLoading: false,
    data: [
      {
        id: 'template-1',
        companyId: null,
        sourceTemplateId: null,
        title: 'Standard New Hire Checklist',
        description: 'Baseline onboarding tasks.',
        category: 'ONBOARDING',
        isActive: true,
        isLibrary: true,
        itemCount: 3,
      },
    ],
  }),
  useMhdCreateChecklistTemplate: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useMhdForkChecklistTemplate: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useMhdCreateChecklistInstance: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useMhdChecklistPeople: () => ({
    isLoading: false,
    data: [{ id: 'person-1', displayName: 'Jordan Rivera' }],
  }),
}));

const { MhdChecklistLibraryPage } = await import('../components/MhdChecklistLibraryPage');

describe('MhdChecklistLibraryPage', () => {
  it('renders library templates with fork affordance for company admins', () => {
    render(<MhdChecklistLibraryPage />);

    expect(screen.getByText('Checklist Library')).toBeInTheDocument();
    expect(screen.getByText('Standard New Hire Checklist')).toBeInTheDocument();
    expect(screen.getByText('Fork to My Company')).toBeInTheDocument();
  });
});
