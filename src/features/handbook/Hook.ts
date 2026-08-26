import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import type {
  MhdAcknowledgeInput,
  MhdAssignAcknowledgmentInput,
  MhdCreateHandbookInput,
  MhdCreateHandbookSectionInput,
  MhdForkHandbookSectionInput,
  MhdHandbookListFilters,
  MhdHandbookSectionFilters,
  MhdPublishHandbookInput,
  MhdToggleSectionInput,
  MhdUpdateHandbookSectionInput,
} from './Types';
import { mhdHandbookService } from './Service';

export const mhdHandbookQueryKeys = {
  privileged: () => ['mhd-handbook', 'privileged'] as const,
  safetyJurisdictions: (companyId: string | null, establishmentId: string | null) =>
    ['mhd-handbook', 'safety-jurisdictions', companyId ?? '', establishmentId ?? ''] as const,
  sections: (filters: MhdHandbookSectionFilters) => ['mhd-handbook', 'sections', filters] as const,
  handbooks: (filters: MhdHandbookListFilters) => ['mhd-handbook', 'handbooks', filters] as const,
  preview: (handbookId: string | null) => ['mhd-handbook', 'preview', handbookId ?? ''] as const,
  version: (versionId: string | null) => ['mhd-handbook', 'version', versionId ?? ''] as const,
  ackStatus: (versionId: string | null) => ['mhd-handbook', 'ack-status', versionId ?? ''] as const,
  myAcknowledgments: () => ['mhd-handbook', 'my-acknowledgments'] as const,
  people: (companyId: string | null) => ['mhd-handbook', 'people', companyId ?? 'ALL'] as const,
};

// ---------------------------------------------------------------------------
// Route gate
// ---------------------------------------------------------------------------

/**
 * The privileged-role gate. Governs the admin affordances; the mutating RPCs
 * re-check the role regardless, so this is a convenience for surfacing, not the
 * security boundary.
 */
export function useMhdHandbookIsPrivileged() {
  return useQuery({
    queryKey: mhdHandbookQueryKeys.privileged(),
    queryFn: () => mhdHandbookService.isPrivileged(),
  });
}

/**
 * The SAFETY content pack's real, computed jurisdiction set for a company
 * (optionally narrowed to one establishment) — see
 * `mhdHandbookService.safetyJurisdictions`. Only enabled when `companyId` is
 * present; the caller falls back to the static jurisdiction list when this
 * returns an empty array (no `osha_establishments` rows yet).
 */
export function useMhdHandbookSafetyJurisdictions(
  companyId: string | null,
  establishmentId?: string | null,
) {
  return useQuery({
    queryKey: mhdHandbookQueryKeys.safetyJurisdictions(companyId, establishmentId ?? null),
    queryFn: () => mhdHandbookService.safetyJurisdictions(companyId!, establishmentId),
    enabled: Boolean(companyId),
  });
}

// ---------------------------------------------------------------------------
// Library / assembly
// ---------------------------------------------------------------------------

export function useMhdHandbookSections(filters: MhdHandbookSectionFilters) {
  return useQuery({
    queryKey: mhdHandbookQueryKeys.sections(filters),
    queryFn: () => mhdHandbookService.listSections(filters),
    enabled: Boolean(filters.companyId && filters.handbookType),
  });
}

/**
 * Creating a section (global library or company-owned) changes the library
 * list; invalidate every `sections` query regardless of filters.
 */
export function useMhdCreateHandbookSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateHandbookSectionInput) => mhdHandbookService.createSection(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'sections'] });
    },
  });
}

export function useMhdUpdateHandbookSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdUpdateHandbookSectionInput) => mhdHandbookService.updateSection(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'sections'] });
    },
  });
}

/**
 * Forking mints a new company-owned section, changing the library list for
 * that company; invalidate every `sections` query regardless of filters.
 */
export function useMhdForkHandbookSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdForkHandbookSectionInput) => mhdHandbookService.forkSection(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'sections'] });
    },
  });
}

export function useMhdHandbooks(filters: MhdHandbookListFilters) {
  return useQuery({
    queryKey: mhdHandbookQueryKeys.handbooks(filters),
    queryFn: () => mhdHandbookService.list(filters),
    enabled: Boolean(filters.companyId),
  });
}

export function useMhdCreateHandbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdCreateHandbookInput) => mhdHandbookService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'handbooks'] });
    },
  });
}

export function useMhdHandbookPreview(handbookId: string | null) {
  return useQuery({
    queryKey: mhdHandbookQueryKeys.preview(handbookId),
    queryFn: () => mhdHandbookService.preview(handbookId!),
    enabled: Boolean(handbookId),
  });
}

/**
 * Toggling a section changes the assembled preview; invalidate the preview so the
 * draft re-renders with the new selection.
 */
export function useMhdToggleHandbookSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdToggleSectionInput) => mhdHandbookService.toggleSection(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'preview'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Publish / versions
// ---------------------------------------------------------------------------

/**
 * Publishing flips the handbook to PUBLISHED, freezes a version, and archives the
 * prior one — so the handbook list, the preview, and any version view all change.
 * Invalidate broadly across the module.
 */
export function useMhdPublishHandbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdPublishHandbookInput) => mhdHandbookService.publish(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'handbooks'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'preview'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'version'] });
    },
  });
}

export function useMhdHandbookVersion(versionId: string | null) {
  return useQuery({
    queryKey: mhdHandbookQueryKeys.version(versionId),
    queryFn: () => mhdHandbookService.versionGet(versionId!),
    enabled: Boolean(versionId),
  });
}

export function useMhdArchiveHandbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (handbookId: string) => mhdHandbookService.archive(handbookId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'handbooks'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Acknowledgment ceremony
// ---------------------------------------------------------------------------

export function useMhdHandbookAckStatus(versionId: string | null) {
  return useQuery({
    queryKey: mhdHandbookQueryKeys.ackStatus(versionId),
    queryFn: () => mhdHandbookService.ackStatus(versionId!),
    enabled: Boolean(versionId),
  });
}

export function useMhdMyAcknowledgments() {
  return useQuery({
    queryKey: mhdHandbookQueryKeys.myAcknowledgments(),
    queryFn: () => mhdHandbookService.myAcknowledgments(),
  });
}

/**
 * Assigning an acknowledgment changes the version's board and (if the person has
 * an account) their own surface, so both are invalidated.
 */
export function useMhdAssignAcknowledgment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAssignAcknowledgmentInput) =>
      mhdHandbookService.assignAcknowledgment(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'ack-status'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'my-acknowledgments'] });
    },
  });
}

/**
 * Acknowledging flips the row on both the admin board and the employee surface.
 * The server GATES this on the e-signature completing — a failure here is often
 * that gate, and callers surface its message rather than pre-empting it.
 */
export function useMhdAcknowledgeHandbook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MhdAcknowledgeInput) => mhdHandbookService.acknowledge(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'ack-status'] });
      void queryClient.invalidateQueries({ queryKey: ['mhd-handbook', 'my-acknowledgments'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Pickers
// ---------------------------------------------------------------------------

export function useMhdHandbookPeople(companyId: string | null) {
  return useQuery({
    queryKey: mhdHandbookQueryKeys.people(companyId),
    // listPeople requires { companyId, searchTerm }; the board lists the whole
    // company, so the search term is empty.
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: Boolean(companyId),
  });
}
