import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdAccommodationOptionCatalogEntry } from '../Types';

const COMPANY_ID = crypto.randomUUID();

const { authRef, catalogRef, createMock, updateMock, mockDraft, draftOptionsLog } = vi.hoisted(
  () => ({
    authRef: {
      current: { profile: null, roles: [] } as {
        profile: { companyId: string; personId: string | null } | null;
        roles: MhdAuthRoleName[];
      },
    },
    catalogRef: { current: [] as unknown[] },
    createMock: vi.fn(),
    updateMock: vi.fn(),
    mockDraft: {
      draft: null as unknown,
      isLoading: false,
      isSaving: false,
      savedAt: null as string | null,
      saveError: null as string | null,
      save: vi.fn(),
      discard: vi.fn(),
    },
    draftOptionsLog: [] as { draftKind: string; draftKey: string; companyId?: string | null }[],
  }),
);

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => authRef.current }));

vi.mock('@/features/drafts/Hook', () => ({
  useMhdDraft: (options: { draftKind: string; draftKey: string; companyId?: string | null }) => {
    draftOptionsLog.push(options);
    return mockDraft;
  },
}));

vi.mock('@/components/ui/MhdFormIntakeDefaultPanel', () => ({
  MhdFormIntakeDefaultPanel: () => null,
}));

vi.mock('../Hook', () => ({
  useMhdAccommodationOptionCatalog: () => ({ data: catalogRef.current, isLoading: false }),
  useMhdCreateAccommodationOptionCatalogEntry: () => ({
    mutateAsync: createMock,
    isPending: false,
  }),
  useMhdUpdateAccommodationOptionCatalogEntry: () => ({
    mutateAsync: updateMock,
    isPending: false,
  }),
  useMhdForkAccommodationOptionCatalogEntry: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

const { MhdAccommodationOptionCatalogPage } =
  await import('../components/MhdAccommodationOptionCatalogPage');

const ENTRY: MhdAccommodationOptionCatalogEntry = {
  id: crypto.randomUUID(),
  companyId: COMPANY_ID,
  isLibrary: false,
  optionType: 'Anti-glare monitor filter',
  descriptionTemplate: 'Fit a glare filter to the primary monitor.',
  category: 'EQUIPMENT',
  functionalLimitationTags: [],
  typicalCostRange: '$40-$90',
  sourceOptionId: null,
  sortOrder: 20,
  isActive: true,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <MhdAccommodationOptionCatalogPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authRef.current = { profile: { companyId: COMPANY_ID, personId: null }, roles: ['HR Partner'] };
  catalogRef.current = [ENTRY];
  mockDraft.draft = null;
  mockDraft.save.mockResolvedValue(undefined);
  mockDraft.discard.mockResolvedValue(undefined);
  createMock.mockResolvedValue('entry-new');
  updateMock.mockResolvedValue(undefined);
  draftOptionsLog.length = 0;
});

describe('MhdAccommodationOptionCatalogPage modals', () => {
  it('opens New Entry as a dialog and saves a draft of the entry', async () => {
    renderPage();
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'New Entry' }));
    const dialog = screen.getByRole('dialog', { name: 'Add A Catalog Entry' });

    fireEvent.change(within(dialog).getByPlaceholderText('e.g. Adjustable-height desk'), {
      target: { value: 'Sit-stand desk converter' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Draft' }));

    await waitFor(() => expect(mockDraft.save).toHaveBeenCalledTimes(1));
    expect(mockDraft.save.mock.calls[0][0].payload).toMatchObject({
      optionType: 'Sit-stand desk converter',
      category: 'OTHER',
    });
    expect(draftOptionsLog.at(-1)).toMatchObject({
      draftKind: 'ACCOMMODATION_OPTION_CATALOG',
      draftKey: 'new',
      companyId: COMPANY_ID,
    });
  });

  it('restores a new-entry draft and discards it after the entry is added', async () => {
    mockDraft.draft = {
      id: crypto.randomUUID(),
      draftKind: 'ACCOMMODATION_OPTION_CATALOG',
      draftKey: 'new',
      title: null,
      stepKey: null,
      payload: {
        optionType: 'Noise-cancelling headset',
        descriptionTemplate: 'Provide a headset for open-plan seating.',
        category: 'TECHNOLOGY',
        functionalLimitationTags: [],
        typicalCostRange: '$150-$300',
        sortOrder: '40',
        isGlobal: false,
      },
      updatedAt: '2026-11-20T15:00:00Z',
      expiresAt: '2026-12-20T15:00:00Z',
    };
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'New Entry' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Resume Draft' }));
    expect(within(dialog).getByPlaceholderText('e.g. Adjustable-height desk')).toHaveValue(
      'Noise-cancelling headset',
    );

    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Entry' }));
    await waitFor(() =>
      expect(createMock).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: COMPANY_ID,
          optionType: 'Noise-cancelling headset',
          category: 'TECHNOLOGY',
          sortOrder: 40,
        }),
      ),
    );
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('refuses an entry without a title in the dialog and keeps the draft', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'New Entry' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add Entry' }));

    expect(
      await within(dialog).findByText('Enter both an option type and a description template.'),
    ).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
    expect(mockDraft.discard).not.toHaveBeenCalled();
  });

  it('edits an entry in a dialog keyed by the entry id', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog', { name: `Edit ${ENTRY.optionType}` });
    expect(draftOptionsLog.at(-1)).toMatchObject({ draftKey: ENTRY.id });

    fireEvent.change(within(dialog).getByDisplayValue('$40-$90'), {
      target: { value: '$50-$100' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Changes' }));

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ entryId: ENTRY.id, typicalCostRange: '$50-$100' }),
      ),
    );
    await waitFor(() => expect(mockDraft.discard).toHaveBeenCalledTimes(1));
  });
});
