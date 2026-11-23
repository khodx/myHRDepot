import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import type { MhdDraft, MhdDraftPayload, MhdSaveDraftInput } from '@/features/drafts/Types';

// Shared scaffolding for the leave action modals' server-side drafts. A test file mocks the
// drafts service with this object:
//   vi.mock('@/features/drafts/Service', async () => ({
//     mhdDraftService: (await import('./leaveDraftTestKit')).mhdLeaveDraftServiceMock,
//   }));

export const mhdLeaveDraftServiceMock = {
  get: vi.fn(),
  list: vi.fn(),
  save: vi.fn(),
  discard: vi.fn(),
};

export function mhdTestLeaveDraft(
  draftKey: string,
  payload: MhdDraftPayload,
  updatedAt = '2026-11-20T15:30:00Z',
): MhdDraft {
  return {
    id: crypto.randomUUID(),
    draftKind: 'LEAVE_CASE_ACTION',
    draftKey,
    title: null,
    stepKey: null,
    payload,
    updatedAt,
    expiresAt: '2027-02-18T15:30:00Z',
  };
}

/** No saved draft; save echoes what was saved; discard succeeds. */
export function mhdResetLeaveDraftService(saved: MhdDraft | null = null) {
  mhdLeaveDraftServiceMock.get.mockResolvedValue(saved);
  mhdLeaveDraftServiceMock.list.mockResolvedValue([]);
  mhdLeaveDraftServiceMock.save.mockImplementation(async (input: MhdSaveDraftInput) =>
    mhdTestLeaveDraft(input.draftKey, input.payload, '2026-11-22T09:15:00Z'),
  );
  mhdLeaveDraftServiceMock.discard.mockResolvedValue(true);
}

export function mhdRenderWithQueryClient(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const result = render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
  return {
    ...result,
    rerender: (next: ReactElement) =>
      result.rerender(<QueryClientProvider client={client}>{next}</QueryClientProvider>),
  };
}
