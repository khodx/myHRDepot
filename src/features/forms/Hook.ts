import { useCallback, useEffect, useState } from 'react';
import { mhdFormService } from './Service';
import type {
  MhdForm,
  MhdFormIntakeKind,
  MhdFormLibraryEntry,
  MhdFormStatus,
  MhdFormsIndexFilters,
  MhdFormSubmission,
} from './Types';

const DEFAULT_FILTERS: MhdFormsIndexFilters = {
  status: 'ALL',
};

// The Library browse surface defaults to ACTIVE (matching
// mhd_list_form_library's own SQL default) rather than the Studio's ALL —
// Library is for finding a fillable/forkable form, not for managing drafts.
const DEFAULT_LIBRARY_FILTERS: MhdFormsIndexFilters = {
  status: 'ACTIVE',
};

export function useMhdFormsIndex(companyId: string | null) {
  const [forms, setForms] = useState<MhdForm[]>([]);
  const [drafts, setDrafts] = useState<MhdFormSubmission[]>([]);
  const [filters, setFilters] = useState<MhdFormsIndexFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setForms([]);
      setDrafts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [formRows, draftRows] = await Promise.all([
        mhdFormService.listFormsForCompany(
          companyId,
          filters.status === 'ALL' ? undefined : filters.status,
        ),
        mhdFormService.listMyDraftSubmissions(),
      ]);
      setForms(formRows);
      setDrafts(draftRows);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load forms.');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, filters.status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-filter-change pattern used throughout the scaffold.
    void load();
  }, [load]);

  return {
    forms,
    drafts,
    filters,
    setFilters,
    isLoading,
    errorMessage,
    refresh: load,
  };
}

/**
 * Forms Library index (migration 0183, Multi-Tenant Library Architecture) —
 * the merged view of platform-wide library forms plus the caller's own
 * company's forms, fetched via `mhd_list_form_library`. Mirrors
 * `useMhdFormsIndex`'s fetch-on-filter-change shape, kept as a separate hook
 * because it fetches a different, lighter-weight row shape
 * (`MhdFormLibraryEntry`, no `definition`) and has its own default filter.
 */
export function useMhdFormLibrary(companyId: string | null) {
  const [entries, setEntries] = useState<MhdFormLibraryEntry[]>([]);
  const [filters, setFilters] = useState<MhdFormsIndexFilters>(DEFAULT_LIBRARY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const rows = await mhdFormService.listFormLibrary(
        companyId,
        filters.status === 'ALL' ? undefined : filters.status,
      );
      setEntries(rows);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load form library.');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, filters.status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-filter-change pattern used throughout the scaffold.
    void load();
  }, [load]);

  return {
    entries,
    filters,
    setFilters,
    isLoading,
    errorMessage,
    refresh: load,
  };
}

export function useMhdFormIntakeDefault(companyId: string | null, intakeKind: MhdFormIntakeKind) {
  const [defaultForm, setDefaultForm] = useState<{
    formId: string;
    formName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setDefaultForm(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setDefaultForm(await mhdFormService.getFormIntakeDefault(companyId, intakeKind));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load form intake default.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [companyId, intakeKind]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout the scaffold.
    void load();
  }, [load]);

  return { default: defaultForm, isLoading, errorMessage, refresh: load };
}

export function useMhdFormIntakeDefaults(companyId: string | null) {
  const [defaults, setDefaults] = useState<
    Array<{
      intakeKind: MhdFormIntakeKind;
      formId: string;
      formName: string;
      formStatus: MhdFormStatus;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!companyId) {
      setDefaults([]);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setDefaults(await mhdFormService.listFormIntakeDefaults(companyId));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Unable to load form intake defaults.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout the scaffold.
    void load();
  }, [load]);

  const setDefault = useCallback(
    async (intakeKind: MhdFormIntakeKind, formId: string) => {
      await mhdFormService.setFormIntakeDefault(companyId ?? '', intakeKind, formId);
      await load();
    },
    [companyId, load],
  );
  const clearDefault = useCallback(
    async (intakeKind: MhdFormIntakeKind) => {
      await mhdFormService.clearFormIntakeDefault(companyId ?? '', intakeKind);
      await load();
    },
    [companyId, load],
  );

  return { defaults, isLoading, errorMessage, refresh: load, setDefault, clearDefault };
}
