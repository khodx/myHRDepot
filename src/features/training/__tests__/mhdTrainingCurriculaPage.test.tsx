import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MhdTrainingCurriculum } from '../Types';

const { createMock, updateMock, deleteMock } = vi.hoisted(() => ({
  createMock: vi.fn().mockResolvedValue(undefined),
  updateMock: vi.fn().mockResolvedValue(undefined),
  deleteMock: vi.fn().mockResolvedValue(undefined),
}));

const { listMock } = vi.hoisted(() => ({ listMock: vi.fn() }));

vi.mock('../Hook', () => ({
  useMhdTrainingCurriculums: listMock,
  useMhdCreateTrainingCurriculum: () => ({ mutateAsync: createMock }),
  useMhdUpdateTrainingCurriculum: () => ({ mutateAsync: updateMock }),
  useMhdDeleteTrainingCurriculum: () => ({ mutateAsync: deleteMock }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));

const { MhdTrainingCurriculaPage } = await import('../components/MhdTrainingCurriculaPage');

function curriculum(overrides: Partial<MhdTrainingCurriculum>): MhdTrainingCurriculum {
  return {
    id: 'cur-1',
    referenceId: 'CUR-0001',
    companyId: 'company-1',
    title: 'Workplace Compliance',
    description: 'Statutory training',
    isActive: true,
    isGlobal: false,
    ...overrides,
  };
}

describe('MhdTrainingCurriculaPage', () => {
  it('renders the Active/Inactive badge from the real isActive value, not hardcoded', () => {
    listMock.mockReturnValue({
      data: [curriculum({ id: 'a', title: 'Active One', isActive: true }), curriculum({ id: 'b', title: 'Inactive One', isActive: false })],
    });
    render(<MhdTrainingCurriculaPage />);

    const activeRow = screen.getByText('Active One').closest('tr') as HTMLElement;
    const inactiveRow = screen.getByText('Inactive One').closest('tr') as HTMLElement;
    expect(within(activeRow).getByText('Active')).toBeInTheDocument();
    expect(within(inactiveRow).getByText('Inactive')).toBeInTheDocument();
  });

  it('creates a curriculum from the New Curriculum modal', async () => {
    listMock.mockReturnValue({ data: [] });
    render(<MhdTrainingCurriculaPage />);

    await userEvent.click(screen.getByRole('button', { name: 'New Curriculum' }));
    await userEvent.type(screen.getByLabelText('Title'), 'Sales Enablement');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(createMock).toHaveBeenCalledWith({
      companyId: 'company-1',
      title: 'Sales Enablement',
      description: '',
    });
  });

  it('surfaces the real delete-guard error from the server instead of swallowing it', async () => {
    deleteMock.mockRejectedValueOnce(new Error("Remove this curriculum's programs before deleting it"));
    listMock.mockReturnValue({ data: [curriculum({})] });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<MhdTrainingCurriculaPage />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Remove this curriculum's programs before deleting it",
    );
  });
});
