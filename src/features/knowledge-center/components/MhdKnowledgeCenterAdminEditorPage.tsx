import { useState } from 'react';
import { mhdIsPlatformAdmin } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdPaginationControls } from '@/components/ui/MhdPagination';
import { mhdPaginationSummary, useMhdPagination } from '@/components/ui/MhdPaginationUtils';
import { MhdTable, MhdTableFooter, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdArchiveKbFunction,
  useMhdCreateKbFunction,
  useMhdKbFunctionAdmin,
  useMhdKbFunctionsAdmin,
  useMhdRestoreKbFunction,
  useMhdUpdateKbFunction,
} from '../Hook';
import type { MhdKbFunctionFormValues } from '../Schemas';
import { MhdKbFunctionForm } from './MhdKbFunctionForm';
import { MhdKbArticleManager } from './MhdKbArticleManager';
import type { MhdKbFunctionAdminListItem } from '../Types';
import { MHD_KB_ACCESS_LEVEL_LABELS, MHD_KB_PLATFORM_ACCESS_LEVELS } from '../Types';

type Tab = 'articles' | 'functions';
type Dialog = { kind: 'function'; id?: string } | null;

export function MhdKnowledgeCenterAdminEditorPage() {
  const { roles } = useMhdAuth();
  const allowed = mhdIsPlatformAdmin(roles);
  const [tab, setTab] = useState<Tab>('articles');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [engine, setEngine] = useState('');
  const [accessLevel, setAccessLevel] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const funcs = useMhdKbFunctionsAdmin({
    searchTerm: search,
    relatedEngine: engine || undefined,
    includeArchived: status === 'archived',
  });
  const functionDetail = useMhdKbFunctionAdmin(dialog?.id ?? null);
  const functionItems = (funcs.data?.items ?? []).filter(
    (item) => status !== 'archived' || item.isDeleted,
  );
  const pagination = useMhdPagination(functionItems.length, {
    resetKey: `functions:${search}:${status}:${engine}`,
  });
  const createFunction = useMhdCreateKbFunction();
  const updateFunction = useMhdUpdateKbFunction();
  const archiveFunction = useMhdArchiveKbFunction();
  const restoreFunction = useMhdRestoreKbFunction();

  if (!allowed) {
    return (
      <p className="text-sm text-muted-foreground">You do not have access to content management.</p>
    );
  }

  async function saveFunction(values: MhdKbFunctionFormValues) {
    const input = {
      name: values.name,
      category: values.category,
      syntax: values.syntax,
      description: values.description,
      exampleInput: values.exampleInput,
      exampleOutput: values.exampleOutput,
      relatedEngine: values.relatedEngine,
      accessLevel: values.accessLevel,
    };
    if (functionDetail.data) {
      await updateFunction.mutateAsync({
        ...input,
        functionId: functionDetail.data.id,
        isDeprecated: values.isDeprecated,
      });
    } else {
      await createFunction.mutateAsync(input);
    }
    setDialog(null);
  }

  const mutationError = [createFunction, updateFunction, archiveFunction, restoreFunction].find(
    (mutation) => mutation.error,
  )?.error;

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Manage Knowledge Center"
        description="Create, edit, publish, archive, and restore knowledge center content."
        actions={
          tab === 'articles' ? (
            <span className="text-sm text-muted-foreground">Platform articles</span>
          ) : (
            <Button onClick={() => setDialog({ kind: 'function' })}>New Function</Button>
          )
        }
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setTab('articles');
            setStatus('all');
            setSearch('');
          }}
          className={`rounded-md border px-3 py-2 text-sm ${
            tab === 'articles' ? 'border-accent bg-accent-tint' : 'border-border'
          }`}
        >
          Articles
        </button>
        <button
          type="button"
          onClick={() => {
            setTab('functions');
            setStatus('all');
            setSearch('');
          }}
          className={`rounded-md border px-3 py-2 text-sm ${
            tab === 'functions' ? 'border-accent bg-accent-tint' : 'border-border'
          }`}
        >
          Functions
        </button>
      </div>
      {tab === 'articles' ? (
        <MhdKbArticleManager scope="PLATFORM" companyId={null} />
      ) : (
        <>
          {mutationError ? (
            <p
              role="alert"
              className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {mutationError instanceof Error ? mutationError.message : 'Unable to save content.'}
            </p>
          ) : null}
          <MhdFilterBar>
            <MhdFilterInput
              label="Search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search content"
            />
            <MhdFilterSelect
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All</option>
              <option value="archived">Archived</option>
            </MhdFilterSelect>
            <MhdFilterSelect
              label="Access Level"
              value={accessLevel}
              onChange={(event) => setAccessLevel(event.target.value)}
            >
              <option value="">All Access Levels</option>
              {MHD_KB_PLATFORM_ACCESS_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {MHD_KB_ACCESS_LEVEL_LABELS[level]}
                </option>
              ))}
            </MhdFilterSelect>
            <MhdFilterSelect
              label="Related engine"
              value={engine}
              onChange={(event) => setEngine(event.target.value)}
            >
              <option value="">All engines</option>
              <option value="calculator">Calculator</option>
              <option value="automation">Automation</option>
              <option value="forms">Forms</option>
            </MhdFilterSelect>
          </MhdFilterBar>
          {funcs.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <MhdCard className="overflow-hidden p-0">
              <MhdTable>
                <thead>
                  <tr>
                    <MhdTh>Name</MhdTh>
                    <MhdTh>Access Level</MhdTh>
                    <MhdTh>Updated</MhdTh>
                    <MhdTh>Actions</MhdTh>
                  </tr>
                </thead>
                <tbody>
                  {pagination.sliceItems(functionItems).map((row) => (
                    <FunctionRow
                      key={row.id}
                      row={row}
                      onEdit={() => setDialog({ kind: 'function', id: row.id })}
                      onArchive={() => void archiveFunction.mutateAsync(row.id)}
                      onRestore={() => void restoreFunction.mutateAsync(row.id)}
                      pending={archiveFunction.isPending || restoreFunction.isPending}
                    />
                  ))}
                </tbody>
              </MhdTable>
              <MhdTableFooter
                summary={mhdPaginationSummary(pagination, functionItems.length, 'functions')}
              >
                <MhdPaginationControls pagination={pagination} />
              </MhdTableFooter>
            </MhdCard>
          )}
        </>
      )}
      {dialog ? (
        <MhdModal
          title={dialog.id ? 'Edit Function' : 'New Function'}
          onClose={() => setDialog(null)}
        >
          {dialog.id && functionDetail.isLoading ? (
            <p>Loading…</p>
          ) : (
            <MhdKbFunctionForm
              func={functionDetail.data ?? undefined}
              onSubmit={saveFunction}
              onCancel={() => setDialog(null)}
              isSubmitting={createFunction.isPending || updateFunction.isPending}
            />
          )}
        </MhdModal>
      ) : null}
    </div>
  );
}

function FunctionRow({
  row,
  onEdit,
  onArchive,
  onRestore,
  pending,
}: {
  row: MhdKbFunctionAdminListItem;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  pending: boolean;
}) {
  return (
    <MhdTr>
      <MhdTd className="font-medium">{row.name}</MhdTd>
      <MhdTd>{MHD_KB_ACCESS_LEVEL_LABELS[row.accessLevel]}</MhdTd>
      <MhdTd>{row.updatedAt}</MhdTd>
      <MhdTd>
        <div className="flex gap-3">
          <button type="button" onClick={onEdit} className="text-accent">
            Edit
          </button>
          {row.isDeleted ? (
            <button type="button" onClick={onRestore} disabled={pending} className="text-accent">
              Restore
            </button>
          ) : (
            <button type="button" onClick={onArchive} disabled={pending} className="text-accent">
              Archive
            </button>
          )}
        </div>
      </MhdTd>
    </MhdTr>
  );
}
