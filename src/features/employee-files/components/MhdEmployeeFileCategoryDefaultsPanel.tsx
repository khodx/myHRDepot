import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdSearchableSelect } from '@/components/ui/MhdSearchableSelect';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { mhdFormService } from '@/features/forms/Service';
import {
  useMhdClearEmployeeFileCategoryDefault,
  useMhdEmployeeFileCategoryDefaults,
  useMhdSetEmployeeFileCategoryDefault,
} from '../Hook';
import { MHD_EMPLOYEE_FILE_TYPES, type MhdEmployeeFileTypeKey } from '../Types';

interface Props {
  /** A specific company — this settings surface is always scoped to one company at a time. */
  companyId: string;
}

/**
 * Platform Admin / HR Partner settings surface for the per-company,
 * per-category canonical form (migration
 * 0187_employee_file_category_defaults.sql). Mounted on `MhdEmployeeFilesPage`
 * only once a single company is selected — a default is meaningless across
 * "All Companies" — and only when the page's own PA/HRP gate passes, since
 * `/employees` is already a Platform Admin / HR Partner only route.
 */
export function MhdEmployeeFileCategoryDefaultsPanel({ companyId }: Props) {
  const defaultsQuery = useMhdEmployeeFileCategoryDefaults(companyId);
  // Candidate forms per category: no dedicated "active forms by category" RPC
  // exists yet, so this mirrors MhdEmployeeFileNewRecordPage's own approach —
  // fetch the company's active forms once and filter client-side by category.
  const formsQuery = useQuery({
    queryKey: ['mhd-employee-file-category-defaults-forms', companyId],
    queryFn: () => mhdFormService.listFormsForCompany(companyId, 'ACTIVE'),
    enabled: Boolean(companyId),
  });
  const setDefault = useMhdSetEmployeeFileCategoryDefault(companyId);
  const clearDefault = useMhdClearEmployeeFileCategoryDefault(companyId);

  const [pendingSelection, setPendingSelection] = useState<
    Partial<Record<MhdEmployeeFileTypeKey, string>>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultsByCategory = useMemo(() => {
    const map = new Map<MhdEmployeeFileTypeKey, { formId: string; formName: string }>();
    for (const row of defaultsQuery.data ?? []) {
      map.set(row.category, { formId: row.formId, formName: row.formName });
    }
    return map;
  }, [defaultsQuery.data]);

  async function handleSetDefault(category: MhdEmployeeFileTypeKey) {
    const formId = pendingSelection[category];
    if (!formId) return;
    setErrorMessage(null);
    try {
      await setDefault.mutateAsync({ category, formId });
      setPendingSelection((previous) => ({ ...previous, [category]: '' }));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable To Set Default Form.');
    }
  }

  async function handleClearDefault(category: MhdEmployeeFileTypeKey) {
    setErrorMessage(null);
    try {
      await clearDefault.mutateAsync(category);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable To Clear Default Form.');
    }
  }

  const loadErrorMessage =
    errorMessage ??
    (defaultsQuery.error instanceof Error
      ? defaultsQuery.error.message
      : formsQuery.error instanceof Error
        ? formsQuery.error.message
        : defaultsQuery.isError || formsQuery.isError
          ? 'Unable To Load Category Default Forms.'
          : null);

  return (
    <MhdCard className="overflow-hidden p-0">
      <div className="flex items-start gap-3 border-b border-border bg-card px-5 py-4">
        <Settings className="mt-1 h-5 w-5 text-accent" aria-hidden />
        <div>
          <h2 className="text-base font-semibold text-foreground">Category Default Forms</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            When a category has a default form, New Record opens that form directly instead of
            showing the picker. Only active forms with a matching Employee File Destination are
            eligible.
          </p>
        </div>
      </div>

      {loadErrorMessage ? (
        <p className="mx-5 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadErrorMessage}
        </p>
      ) : null}

      {defaultsQuery.isLoading || formsQuery.isLoading ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">Loading Category Defaults...</p>
      ) : (
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>Category</MhdTh>
              <MhdTh>Current Default</MhdTh>
              <MhdTh>Set Default</MhdTh>
            </tr>
          </thead>
          <tbody>
            {MHD_EMPLOYEE_FILE_TYPES.map((fileType) => {
              const current = defaultsByCategory.get(fileType.key);
              const candidateForms = (formsQuery.data ?? []).filter(
                (form) => form.employeeFileCategory === fileType.key,
              );
              const selectedFormId = pendingSelection[fileType.key] ?? '';

              return (
                <MhdTr key={fileType.key}>
                  <MhdTd>
                    <p className="font-semibold text-foreground">{fileType.label}</p>
                  </MhdTd>
                  <MhdTd>
                    {current ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground">{current.formName}</span>
                        <Button
                          variant="secondary"
                          className="h-8 px-3 text-xs"
                          disabled={clearDefault.isPending}
                          onClick={() => void handleClearDefault(fileType.key)}
                        >
                          Clear Default
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No Default Set</span>
                    )}
                  </MhdTd>
                  <MhdTd>
                    <div className="flex flex-wrap items-center gap-2">
                      <MhdSearchableSelect
                        id={`mhd-employee-file-category-default-${fileType.key}`}
                        className="min-w-[220px]"
                        options={candidateForms.map((form) => ({ id: form.id, label: form.name }))}
                        value={selectedFormId}
                        onChange={(formId) =>
                          setPendingSelection((previous) => ({
                            ...previous,
                            [fileType.key]: formId,
                          }))
                        }
                        placeholder={
                          candidateForms.length === 0
                            ? 'No Active Forms For This Category'
                            : 'Select A Form'
                        }
                        emptyMessage="No Active Forms Tagged With This Category."
                        disabled={candidateForms.length === 0}
                      />
                      <Button
                        className="h-8 px-3 text-xs"
                        disabled={!selectedFormId || setDefault.isPending}
                        onClick={() => void handleSetDefault(fileType.key)}
                      >
                        Set Default
                      </Button>
                    </div>
                  </MhdTd>
                </MhdTr>
              );
            })}
          </tbody>
        </MhdTable>
      )}
    </MhdCard>
  );
}
