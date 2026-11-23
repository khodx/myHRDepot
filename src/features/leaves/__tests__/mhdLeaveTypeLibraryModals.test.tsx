import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdLeaveType } from '../Types';

const COMPANY_ID = crypto.randomUUID();

const { draftController, createMock, updateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
  draftController: {
    current: {
      draft: null as null | {
        payload: Record<string, unknown>;
        stepKey: string | null;
        updatedAt: string;
      },
      isLoading: false,
      isSaving: false,
      savedAt: null as string | null,
      saveError: null as string | null,
      save: vi.fn(),
      discard: vi.fn(),
    },
  },
}));
const draftKeys: string[] = [];

vi.mock('@/features/drafts/Hook', () => ({
  useMhdDraft: (options: { draftKey: string }) => {
    draftKeys.push(options.draftKey);
    return draftController.current;
  },
}));
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: COMPANY_ID }, roles: ['HR Partner'] }),
}));
vi.mock('@/components/ui/MhdFormIntakeDefaultPanel', () => ({
  MhdFormIntakeDefaultPanel: () => null,
}));

const companyType: MhdLeaveType = {
  id: crypto.randomUUID(),
  companyId: COMPANY_ID,
  isGlobal: false,
  typeKey: 'bereavement',
  typeName: 'Bereavement Leave',
  jurisdiction: 'CA',
  entitlementHours: 40,
  measurementMethod: 'PER_EVENT',
  measurementMonths: null,
  requiresCertification: false,
  citation: null,
} as MhdLeaveType;

vi.mock('../Hook', () => ({
  useMhdLeaveTypes: () => ({ data: [companyType], isLoading: false }),
  useMhdCreateLeaveType: () => ({ mutateAsync: createMock, isPending: false }),
  useMhdUpdateLeaveType: () => ({ mutateAsync: updateMock, isPending: false }),
  useMhdForkLeaveType: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { MhdLeaveTypeLibraryPage } = await import('../components/MhdLeaveTypeLibraryPage');

function renderPage() {
  return render(
    <MemoryRouter>
      <MhdLeaveTypeLibraryPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  draftKeys.length = 0;
  draftController.current.draft = null;
  draftController.current.savedAt = null;
  draftController.current.save.mockResolvedValue(undefined);
  draftController.current.discard.mockResolvedValue(undefined);
});

describe('MhdLeaveTypeLibraryPage popups', () => {
  it('opens New Type as a dialog, saves its values as a draft and resumes them', async () => {
    draftController.current.draft = {
      payload: { typeKey: 'jury-duty', typeName: 'Jury Duty Leave' },
      stepKey: null,
      updatedAt: '2026-11-20T10:00:00Z',
    };
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'New Type' }));
    const dialog = screen.getByRole('dialog', { name: 'New Leave Type' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));
    expect(within(dialog).getByLabelText('Type key')).toHaveValue('jury-duty');
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Jury Duty Leave');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(draftController.current.save).toHaveBeenCalledTimes(1));
    expect(draftController.current.save.mock.calls[0][0].payload).toMatchObject({
      typeKey: 'jury-duty',
      typeName: 'Jury Duty Leave',
    });
  });

  it('discards the draft after a successful create', async () => {
    createMock.mockResolvedValue(undefined);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'New Type' }));
    const dialog = screen.getByRole('dialog', { name: 'New Leave Type' });
    fireEvent.change(within(dialog).getByLabelText('Type key'), { target: { value: 'jury-duty' } });
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'Jury Duty Leave' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create Type' }));
    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(draftController.current.discard).toHaveBeenCalled());
  });

  it('opens Edit as a dialog keyed by the type being edited, and discards after saving', async () => {
    updateMock.mockResolvedValue(undefined);
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit Leave Type' });
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Bereavement Leave');
    expect(draftKeys).toContain(companyType.id);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Type' }));
    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(draftController.current.discard).toHaveBeenCalled());
  });
});
