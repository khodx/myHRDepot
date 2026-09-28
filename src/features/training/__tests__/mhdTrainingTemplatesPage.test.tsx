import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));
vi.mock('../Hook', () => ({
  useMhdTrainingTemplates: listMock,
  useMhdCreateTrainingTemplate: () => ({ mutateAsync: vi.fn() }),
  useMhdUpdateTrainingTemplate: () => ({ mutateAsync: vi.fn() }),
  useMhdDeleteTrainingTemplate: () => ({ mutateAsync: vi.fn() }),
  useMhdTrainingTemplateSlots: () => ({ data: [] }),
  useMhdCreateTrainingTemplateSlot: () => ({ mutateAsync: vi.fn() }),
  useMhdUpdateTrainingTemplateSlot: () => ({ mutateAsync: vi.fn() }),
  useMhdDeleteTrainingTemplateSlot: () => ({ mutateAsync: vi.fn() }),
}));
vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => ({ profile: { companyId: 'company-1' } }) }));

const { MhdTrainingTemplatesPage } = await import('../components/MhdTrainingTemplatesPage');

describe('MhdTrainingTemplatesPage', () => {
  it('renders rigidity, active state, and hides actions for global templates', () => {
    listMock.mockReturnValue({ data: [
      { id: 't1', referenceId: 'TPL-1', companyId: 'company-1', title: 'Local', description: null, rigidity: 'COMPOSABLE', isActive: true, isGlobal: false },
      { id: 't2', referenceId: 'TPL-2', companyId: null, title: 'Global', description: null, rigidity: 'LOCKED', isActive: false, isGlobal: true },
    ] });
    render(<MhdTrainingTemplatesPage />);
    const localRow = screen.getByText('Local').closest('tr') as HTMLElement;
    const globalRow = screen.getAllByText('Global')[0].closest('tr') as HTMLElement;
    expect(within(localRow).getByText('Composable')).toBeInTheDocument();
    expect(within(localRow).getByText('Active')).toBeInTheDocument();
    expect(within(globalRow).getByText('Read-only')).toBeInTheDocument();
    expect(within(globalRow).queryByText('Edit')).not.toBeInTheDocument();
  });
});
