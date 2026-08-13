import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MhdCommunicationsTabs } from '@/appshell/components/MhdCommunicationsTabs';
import { mhdCanManageCorrespondenceRouting } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdCompanies } from '@/features/companies/Hook';
import {
  useMhdCorrespondenceMailboxAliases,
  useMhdCorrespondenceActiveMailboxes,
  useMhdCreateCorrespondenceMailboxAlias,
  useMhdUpdateCorrespondenceMailboxAlias,
} from '../Hook';
import {
  mhdCorrespondenceMailboxAliasSchema,
  type MhdCorrespondenceMailboxAliasSchemaInput,
} from '../Schemas';

export function MhdCorrespondenceAliasSettingsPage() {
  const { roles } = useMhdAuth();
  const canManage = mhdCanManageCorrespondenceRouting(roles);
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);

  const companiesQuery = useMhdCompanies({ searchTerm: '' });
  const companies = useMemo(() => companiesQuery.data ?? [], [companiesQuery.data]);
  const aliasesQuery = useMhdCorrespondenceMailboxAliases({
    companyId: companyFilter === 'ALL' ? null : companyFilter,
  });
  const companyNameById = useMemo(
    () => new Map(companies.map((company) => [company.id, company.companyName])),
    [companies],
  );
  const createAlias = useMhdCreateCorrespondenceMailboxAlias();
  const updateAlias = useMhdUpdateCorrespondenceMailboxAlias();

  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<MhdCorrespondenceMailboxAliasSchemaInput>({
    resolver: zodResolver(mhdCorrespondenceMailboxAliasSchema),
    defaultValues: {
      companyId: '',
      mailboxId: '',
      aliasAddress: '',
      isPrimary: true,
    },
  });

  const mailboxesQuery = useMhdCorrespondenceActiveMailboxes(Boolean(selectedCompanyId));
  const mailboxes = useMemo(() => mailboxesQuery.data ?? [], [mailboxesQuery.data]);

  useEffect(() => {
    const currentMailboxId = getValues('mailboxId');
    if (!selectedCompanyId) {
      setValue('mailboxId', '');
      return;
    }
    if (mailboxes.length > 0 && !mailboxes.some((mailbox) => mailbox.id === currentMailboxId)) {
      setValue('mailboxId', mailboxes[0].id);
    }
  }, [getValues, mailboxes, selectedCompanyId, setValue]);

  async function submitAlias(values: MhdCorrespondenceMailboxAliasSchemaInput) {
    await createAlias.mutateAsync(values);
    reset({ companyId: values.companyId, mailboxId: '', aliasAddress: '', isPrimary: true });
    setSelectedCompanyId(values.companyId);
    setIsAddOpen(false);
  }

  return (
    <div className="mx-auto max-w-[104rem] space-y-6">
      <MhdPageHeader
        title="Correspondence routing"
        description="Manage mailbox aliases used to route inbound correspondence."
        backTo="/communications"
        backLabel="Communications"
      />

      <MhdCommunicationsTabs active="routing" />

      <section className="space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Mailbox aliases</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add routing aliases, choose the primary address, and retire addresses without
              deleting routing history.
            </p>
          </div>
          {canManage ? (
            <Button onClick={() => setIsAddOpen((open) => !open)}>
              {isAddOpen ? 'Close' : 'Add alias'}
            </Button>
          ) : null}
        </header>

        <MhdCard className="flex flex-wrap gap-3">
          <MhdFilterSelect
            label="Company"
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
          >
            <option value="ALL">All companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.companyName}
              </option>
            ))}
          </MhdFilterSelect>
        </MhdCard>

        {canManage && isAddOpen ? (
          <form
            onSubmit={handleSubmit(submitAlias)}
            className="space-y-4 rounded-md border border-border bg-muted p-4"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-foreground">
                  Company
                </label>
                <select
                  id="companyId"
                  {...register('companyId', {
                    onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
                      setSelectedCompanyId(event.target.value),
                  })}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
                {errors.companyId ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.companyId.message}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="mailboxId" className="block text-sm font-medium text-foreground">
                  Active mailbox
                </label>
                <select
                  id="mailboxId"
                  {...register('mailboxId')}
                  disabled={!selectedCompanyId || mailboxesQuery.isLoading || mailboxes.length === 0}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {selectedCompanyId ? 'Select mailbox' : 'Select company first'}
                  </option>
                  {mailboxes.map((mailbox) => (
                    <option key={mailbox.id} value={mailbox.id}>
                      {mailbox.label}
                    </option>
                  ))}
                </select>
                {errors.mailboxId ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.mailboxId.message}</p>
                ) : null}
                {selectedCompanyId && !mailboxesQuery.isLoading && mailboxes.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    No active mailboxes are available.
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="aliasAddress"
                  className="block text-sm font-medium text-foreground"
                >
                  Alias address
                </label>
                <input
                  id="aliasAddress"
                  type="email"
                  {...register('aliasAddress')}
                  className="mt-1 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                />
                {errors.aliasAddress ? (
                  <p className="mt-1 text-xs text-rose-600">{errors.aliasAddress.message}</p>
                ) : null}
              </div>

              <label className="flex items-center gap-2 pt-7 text-sm font-medium text-foreground">
                <input type="checkbox" {...register('isPrimary')} className="h-4 w-4" />
                Primary alias
              </label>
            </div>

            {companiesQuery.isError || mailboxesQuery.isError || createAlias.isError ? (
              <p className="text-sm text-rose-600">
                {companiesQuery.error instanceof Error
                  ? companiesQuery.error.message
                  : mailboxesQuery.error instanceof Error
                    ? mailboxesQuery.error.message
                    : createAlias.error instanceof Error
                      ? createAlias.error.message
                      : 'Unable to save alias.'}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  reset();
                  setSelectedCompanyId('');
                  setIsAddOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createAlias.isPending || mailboxes.length === 0}>
                {createAlias.isPending ? 'Adding...' : 'Add alias'}
              </Button>
            </div>
          </form>
        ) : null}

        {aliasesQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading aliases...</p>
        ) : aliasesQuery.isError ? (
          <p className="text-sm text-rose-600">
            {aliasesQuery.error instanceof Error
              ? aliasesQuery.error.message
              : 'Unable to load aliases.'}
          </p>
        ) : (aliasesQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No aliases on record for this filter.</p>
        ) : (
          <MhdCard className="overflow-hidden p-0">
            <MhdTable>
              <thead>
                <tr>
                  <MhdTh>Company</MhdTh>
                  <MhdTh>Alias address</MhdTh>
                  <MhdTh>Primary</MhdTh>
                  <MhdTh>Status</MhdTh>
                  <MhdTh>Created</MhdTh>
                  {canManage ? <MhdTh /> : null}
                </tr>
              </thead>
              <tbody>
                {(aliasesQuery.data ?? []).map((alias) => (
                  <MhdTr key={alias.id}>
                    <MhdTd>
                      {alias.companyName ?? companyNameById.get(alias.companyId) ?? alias.companyId}
                    </MhdTd>
                    <MhdTd className="font-medium text-foreground">{alias.aliasAddress}</MhdTd>
                    <MhdTd>{alias.isPrimary ? 'Yes' : 'No'}</MhdTd>
                    <MhdTd>{alias.isActive ? 'Active' : 'Inactive'}</MhdTd>
                    <MhdTd className="whitespace-nowrap">
                      {new Date(alias.createdAt).toLocaleDateString()}
                    </MhdTd>
                    {canManage ? (
                      <MhdTd>
                        <div className="flex flex-wrap justify-end gap-2">
                          {!alias.isPrimary ? (
                            <Button
                              variant="secondary"
                              className="px-3 py-1.5"
                              disabled={updateAlias.isPending}
                              onClick={() =>
                                updateAlias.mutate({ aliasId: alias.id, isPrimary: true })
                              }
                            >
                              Make primary
                            </Button>
                          ) : null}
                          <Button
                            variant="secondary"
                            className="px-3 py-1.5"
                            disabled={updateAlias.isPending}
                            onClick={() =>
                              updateAlias.mutate({
                                aliasId: alias.id,
                                isActive: !alias.isActive,
                              })
                            }
                          >
                            {alias.isActive ? 'Deactivate' : 'Reactivate'}
                          </Button>
                        </div>
                      </MhdTd>
                    ) : null}
                  </MhdTr>
                ))}
              </tbody>
            </MhdTable>
          </MhdCard>
        )}

        {updateAlias.isError ? (
          <p className="text-sm text-rose-600">
            {updateAlias.error instanceof Error
              ? updateAlias.error.message
              : 'Unable to update alias.'}
          </p>
        ) : null}
      </section>
    </div>
  );
}
