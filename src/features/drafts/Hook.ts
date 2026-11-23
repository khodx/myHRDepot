import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdDraftService } from './Service';
import type { MhdDraft, MhdDraftKind, MhdDraftPayload } from './Types';

export const mhdDraftQueryKeys = {
  one: (draftKind: string, draftKey: string) => ['mhd-drafts', 'one', draftKind, draftKey] as const,
  list: (draftKind: string | null) => ['mhd-drafts', 'list', draftKind ?? 'ALL'] as const,
};

interface MhdDraftSaveArgs {
  payload: MhdDraftPayload;
  stepKey?: string | null;
  title?: string | null;
}

export interface MhdDraftController {
  /** The caller's live draft for this screen instance, or null. */
  draft: MhdDraft | null;
  isLoading: boolean;
  isSaving: boolean;
  /** ISO time of the last successful save made on this screen, or null if none yet this session. */
  savedAt: string | null;
  saveError: string | null;
  save: (input: MhdDraftSaveArgs) => Promise<void>;
  /** Delete the draft; call after a successful submit, or when the user starts over. */
  discard: () => Promise<void>;
}

interface UseMhdDraftOptions {
  draftKind: MhdDraftKind;
  draftKey: string;
  companyId?: string | null;
  /** Load the existing draft only while the screen is open. */
  enabled?: boolean;
}

/** Server-side save and resume for one screen instance (see migration 0393). */
export function useMhdDraft({
  draftKind,
  draftKey,
  companyId,
  enabled = true,
}: UseMhdDraftOptions): MhdDraftController {
  const queryClient = useQueryClient();
  const queryKey = mhdDraftQueryKeys.one(draftKind, draftKey);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  // The hook usually lives in the page that opens the modal, so forget this session's save when the modal closes;
  // otherwise the resume banner stays hidden the next time it opens.
  if (!enabled && savedAt !== null) setSavedAt(null);

  const query = useQuery({
    queryKey,
    queryFn: () => mhdDraftService.get(draftKind, draftKey),
    enabled,
    staleTime: 0,
  });

  const saveMutation = useMutation({
    mutationFn: (input: MhdDraftSaveArgs) =>
      mhdDraftService.save({ draftKind, draftKey, companyId, ...input }),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKey, saved);
      setSavedAt(saved.updatedAt);
      void queryClient.invalidateQueries({ queryKey: ['mhd-drafts', 'list'] });
    },
  });

  const discardMutation = useMutation({
    mutationFn: () => mhdDraftService.discard(draftKind, draftKey),
    onSuccess: () => {
      queryClient.setQueryData(queryKey, null);
      void queryClient.invalidateQueries({ queryKey: ['mhd-drafts', 'list'] });
    },
  });

  const { mutateAsync: saveAsync } = saveMutation;
  const { mutateAsync: discardAsync } = discardMutation;

  const save = useCallback(
    async (input: MhdDraftSaveArgs) => {
      await saveAsync(input);
    },
    [saveAsync],
  );
  const discard = useCallback(async () => {
    await discardAsync();
  }, [discardAsync]);

  return {
    draft: query.data ?? null,
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending,
    savedAt,
    saveError: saveMutation.error instanceof Error ? saveMutation.error.message : null,
    save,
    discard,
  };
}
