import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMhdDraft } from '../Hook';
import { MHD_DRAFT_KINDS, MHD_DRAFT_NEW_KEY, type MhdDraft } from '../Types';

const rpc = vi.fn();
vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: (...args: unknown[]) => rpc(...args) },
}));

const row = {
  id: crypto.randomUUID(),
  draft_kind: 'ACTIVITY_CREATE',
  draft_key: 'new',
  title: 'Quarterly check-in',
  step_key: null,
  payload: { form: { title: 'Quarterly check-in' } },
  updated_at: '2026-11-22T16:00:00Z',
  expires_at: '2026-12-22T16:00:00Z',
};

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function renderDraft(enabled = true) {
  return renderHook(
    ({ on }: { on: boolean }) =>
      useMhdDraft({
        draftKind: MHD_DRAFT_KINDS.activityCreate,
        draftKey: MHD_DRAFT_NEW_KEY,
        companyId: 'company-1',
        enabled: on,
      }),
    { wrapper, initialProps: { on: enabled } },
  );
}

/** Answer each RPC by name, so the order of the hook's parallel queries does not matter. */
function answer(handlers: Record<string, unknown>) {
  rpc.mockImplementation(async (name: string) => handlers[name] ?? { data: [], error: null });
}

describe('useMhdDraft', () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it('loads the live draft for the screen instance', async () => {
    answer({ mhd_draft_get: { data: [row], error: null } });
    const { result } = renderDraft();
    await waitFor(() => expect(result.current.draft).not.toBeNull());
    const draft = result.current.draft as MhdDraft;
    expect(draft.payload).toEqual(row.payload);
    expect(rpc).toHaveBeenCalledWith('mhd_draft_get', {
      p_draft_kind: 'ACTIVITY_CREATE',
      p_draft_key: 'new',
    });
  });

  it('loads the drafts of other people on the same screen that the caller may see', async () => {
    const shared = { ...row, owner_user_id: crypto.randomUUID(), owner_name: 'Priya Raman' };
    rpc.mockImplementation(async (name: string) =>
      name === 'mhd_draft_list_shared'
        ? { data: [shared], error: null }
        : { data: [], error: null },
    );
    const { result } = renderDraft();
    await waitFor(() => expect(result.current.shared).toHaveLength(1));
    expect(result.current.shared?.[0].ownerName).toBe('Priya Raman');
    expect(rpc).toHaveBeenCalledWith('mhd_draft_list_shared', {
      p_draft_kind: 'ACTIVITY_CREATE',
      p_draft_key: 'new',
    });
  });

  it('returns null when there is no draft and does not query while disabled', async () => {
    rpc.mockResolvedValue({ data: [], error: null });
    const { result } = renderDraft(false);
    expect(rpc).not.toHaveBeenCalled();
    expect(result.current.draft).toBeNull();
  });

  it('saves with the kind, key and company and records the save time', async () => {
    answer({ mhd_draft_save: { data: row, error: null } });
    const { result } = renderDraft();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.save({
        payload: { form: { title: 'Quarterly check-in' } },
        stepKey: 'basics',
        title: 'Quarterly check-in',
      });
    });
    expect(rpc).toHaveBeenLastCalledWith('mhd_draft_save', {
      p_draft_kind: 'ACTIVITY_CREATE',
      p_draft_key: 'new',
      p_payload: { form: { title: 'Quarterly check-in' } },
      p_company_id: 'company-1',
      p_title: 'Quarterly check-in',
      p_step_key: 'basics',
    });
    expect(result.current.savedAt).toBe(row.updated_at);
  });

  it("forgets this session's save when the screen closes so the resume banner can return", async () => {
    answer({ mhd_draft_save: { data: row, error: null } });
    const { result, rerender } = renderDraft();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.save({ payload: {} });
    });
    expect(result.current.savedAt).not.toBeNull();
    rerender({ on: false });
    await waitFor(() => expect(result.current.savedAt).toBeNull());
  });

  it('discards the draft and clears it from the cache', async () => {
    answer({
      mhd_draft_get: { data: [row], error: null },
      mhd_draft_discard: { data: true, error: null },
    });
    const { result } = renderDraft();
    await waitFor(() => expect(result.current.draft).not.toBeNull());
    await act(async () => {
      await result.current.discard();
    });
    expect(rpc).toHaveBeenLastCalledWith('mhd_draft_discard', {
      p_draft_kind: 'ACTIVITY_CREATE',
      p_draft_key: 'new',
    });
    await waitFor(() => expect(result.current.draft).toBeNull());
  });

  it('surfaces a refused save without throwing out of the controller state', async () => {
    answer({ mhd_draft_save: { data: null, error: new Error('Draft is too large to save') } });
    const { result } = renderDraft();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.save({ payload: {} }).catch(() => undefined);
    });
    await waitFor(() => expect(result.current.saveError).toBe('Draft is too large to save'));
    expect(result.current.savedAt).toBeNull();
  });
});
