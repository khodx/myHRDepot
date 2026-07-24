import { useCallback, useEffect, useState } from 'react';
import { mhdFormService } from './Service';
import type { MhdForm, MhdFormsIndexFilters, MhdFormSubmission } from './Types';

const DEFAULT_FILTERS: MhdFormsIndexFilters = {
  status: 'ALL',
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
