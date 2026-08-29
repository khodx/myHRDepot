import { useState } from 'react';
import { mhdIsPlatformAdminOrHrPartner } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  mhdPaginationSummary,
  MhdPaginationControls,
  useMhdPagination,
} from '@/components/ui/MhdPagination';
import { MhdTable, MhdTableFooter, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdArchiveKbArticle,
  useMhdArchiveKbFunction,
  useMhdCreateKbArticle,
  useMhdCreateKbFunction,
  useMhdKbArticleAdmin,
  useMhdKbArticlesAdmin,
  useMhdKbFunctionAdmin,
  useMhdKbFunctionsAdmin,
  useMhdPublishKbArticle,
  useMhdRestoreKbArticle,
  useMhdRestoreKbFunction,
  useMhdUpdateKbArticle,
  useMhdUpdateKbFunction,
} from '../Hook';
import type { MhdKbArticleAdmin, MhdKbFunctionAdmin } from '../Types';
import type { MhdKbArticleFormValues, MhdKbFunctionFormValues } from '../Schemas';
import { MhdKbArticleForm } from './MhdKbArticleForm';
import { MhdKbFunctionForm } from './MhdKbFunctionForm';

type Tab = 'articles' | 'functions';
type Dialog = { kind: 'article' | 'function'; id?: string } | null;
export function MhdKnowledgeCenterAdminEditorPage() {
  const { roles } = useMhdAuth();
  const allowed = mhdIsPlatformAdminOrHrPartner(roles);
  const [tab, setTab] = useState<Tab>('articles');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [engine, setEngine] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const articles = useMhdKbArticlesAdmin({ searchTerm: search, status });
  const funcs = useMhdKbFunctionsAdmin({
    searchTerm: search,
    relatedEngine: engine || undefined,
    includeArchived: status === 'archived',
  });
  const articleDetail = useMhdKbArticleAdmin(
    dialog?.kind === 'article' ? (dialog.id ?? null) : null,
  );
  const functionDetail = useMhdKbFunctionAdmin(
    dialog?.kind === 'function' ? (dialog.id ?? null) : null,
  );
  const articleItems = (articles.data?.items ?? []).filter(
    (x) => status !== 'archived' || x.isDeleted,
  );
  const functionItems = (funcs.data?.items ?? []).filter(
    (x) => status !== 'archived' || x.isDeleted,
  );
  const currentItems = tab === 'articles' ? articleItems : functionItems;
  const pagination = useMhdPagination(currentItems.length, {
    resetKey: `${tab}:${search}:${status}:${engine}`,
  });
  const createArticle = useMhdCreateKbArticle();
  const updateArticle = useMhdUpdateKbArticle();
  const publish = useMhdPublishKbArticle();
  const archiveArticle = useMhdArchiveKbArticle();
  const restoreArticle = useMhdRestoreKbArticle();
  const createFunction = useMhdCreateKbFunction();
  const updateFunction = useMhdUpdateKbFunction();
  const archiveFunction = useMhdArchiveKbFunction();
  const restoreFunction = useMhdRestoreKbFunction();
  if (!allowed)
    return (
      <p className="text-sm text-muted-foreground">You do not have access to content management.</p>
    );
  async function saveArticle(values: MhdKbArticleFormValues) {
    const input = {
      categoryId: values.categoryId,
      slug: values.slug,
      title: values.title,
      summary: values.summary,
      body: values.body,
      audience: values.audience,
      routeContext: values.routeContext
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      searchKeywords: values.searchKeywords,
    };
    if (articleDetail.data)
      await updateArticle.mutateAsync({ ...input, articleId: articleDetail.data.id });
    else await createArticle.mutateAsync(input);
    setDialog(null);
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
      audience: values.audience,
    };
    if (functionDetail.data)
      await updateFunction.mutateAsync({
        ...input,
        functionId: functionDetail.data.id,
        isDeprecated: values.isDeprecated,
      });
    else await createFunction.mutateAsync(input);
    setDialog(null);
  }
  const mutationError = [
    createArticle,
    updateArticle,
    publish,
    archiveArticle,
    restoreArticle,
    createFunction,
    updateFunction,
    archiveFunction,
    restoreFunction,
  ].find((m) => m.error)?.error;
  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Manage Knowledge Center"
        description="Create, edit, publish, archive, and restore knowledge center content."
        actions={
          <Button onClick={() => setDialog({ kind: tab === 'articles' ? 'article' : 'function' })}>
            New {tab === 'articles' ? 'Article' : 'Function'}
          </Button>
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
          className={`rounded-md border px-3 py-2 text-sm ${tab === 'articles' ? 'border-accent bg-accent-tint' : 'border-border'}`}
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
          className={`rounded-md border px-3 py-2 text-sm ${tab === 'functions' ? 'border-accent bg-accent-tint' : 'border-border'}`}
        >
          Functions
        </button>
      </div>
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
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search content"
        />
        <MhdFilterSelect label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          {tab === 'articles' ? (
            <>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </>
          ) : null}
          <option value="archived">Archived</option>
        </MhdFilterSelect>
        {tab === 'functions' ? (
          <MhdFilterSelect
            label="Related engine"
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
          >
            <option value="">All engines</option>
            <option value="calculator">Calculator</option>
            <option value="automation">Automation</option>
            <option value="forms">Forms</option>
          </MhdFilterSelect>
        ) : null}
      </MhdFilterBar>
      {(tab === 'articles' ? articles.isLoading : funcs.isLoading) ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>{tab === 'articles' ? 'Title' : 'Name'}</MhdTh>
                <MhdTh>{tab === 'articles' ? 'Status' : 'Engine'}</MhdTh>
                <MhdTh>Updated</MhdTh>
                <MhdTh>Actions</MhdTh>
              </tr>
            </thead>
            <tbody>
              {pagination
                .sliceItems(currentItems as MhdKbArticleAdmin[])
                .map((row) =>
                  tab === 'articles' ? (
                    <ArticleRow
                      key={row.id}
                      row={row as MhdKbArticleAdmin}
                      onEdit={() => setDialog({ kind: 'article', id: row.id })}
                      onPublish={() => void publish.mutateAsync(row.id)}
                      onArchive={() => void archiveArticle.mutateAsync(row.id)}
                      onRestore={() => void restoreArticle.mutateAsync(row.id)}
                      pending={
                        publish.isPending || archiveArticle.isPending || restoreArticle.isPending
                      }
                    />
                  ) : (
                    <FunctionRow
                      key={row.id}
                      row={row as unknown as MhdKbFunctionAdmin}
                      onEdit={() => setDialog({ kind: 'function', id: row.id })}
                      onArchive={() => void archiveFunction.mutateAsync(row.id)}
                      onRestore={() => void restoreFunction.mutateAsync(row.id)}
                      pending={archiveFunction.isPending || restoreFunction.isPending}
                    />
                  ),
                )}
            </tbody>
          </MhdTable>
          <MhdTableFooter summary={mhdPaginationSummary(pagination, currentItems.length, tab)}>
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
        </MhdCard>
      )}
      {dialog?.kind === 'article' ? (
        <MhdModal
          title={dialog.id ? 'Edit Article' : 'New Article'}
          onClose={() => setDialog(null)}
        >
          {dialog.id && articleDetail.isLoading ? (
            <p>Loading…</p>
          ) : (
            <MhdKbArticleForm
              article={articleDetail.data ?? undefined}
              onSubmit={saveArticle}
              onCancel={() => setDialog(null)}
              isSubmitting={createArticle.isPending || updateArticle.isPending}
            />
          )}
        </MhdModal>
      ) : null}
      {dialog?.kind === 'function' ? (
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
function ArticleRow({
  row,
  onEdit,
  onPublish,
  onArchive,
  onRestore,
  pending,
}: {
  row: MhdKbArticleAdmin;
  onEdit: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onRestore: () => void;
  pending: boolean;
}) {
  return (
    <MhdTr>
      <MhdTd className="font-medium">{row.title}</MhdTd>
      <MhdTd>
        <MhdBadge
          variant={row.isDeleted ? 'neutral' : row.status === 'published' ? 'success' : 'warning'}
        >
          {row.isDeleted ? 'Archived' : row.status}
        </MhdBadge>
      </MhdTd>
      <MhdTd>{row.updatedAt}</MhdTd>
      <MhdTd>
        <div className="flex gap-3">
          <button type="button" onClick={onEdit} className="text-accent">
            Edit
          </button>
          {row.isDeleted ? (
            <button
              type="button"
              onClick={onRestore}
              disabled={pending}
              className="text-accent disabled:opacity-50"
            >
              Restore
            </button>
          ) : (
            <>
              {row.status === 'draft' ? (
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={pending}
                  className="text-accent disabled:opacity-50"
                >
                  Publish
                </button>
              ) : null}
              <button
                type="button"
                onClick={onArchive}
                disabled={pending}
                className="text-accent disabled:opacity-50"
              >
                Archive
              </button>
            </>
          )}
        </div>
      </MhdTd>
    </MhdTr>
  );
}
function FunctionRow({
  row,
  onEdit,
  onArchive,
  onRestore,
  pending,
}: {
  row: MhdKbFunctionAdmin;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  pending: boolean;
}) {
  return (
    <MhdTr>
      <MhdTd className="font-medium">{row.name}</MhdTd>
      <MhdTd>{row.relatedEngine}</MhdTd>
      <MhdTd>{row.updatedAt}</MhdTd>
      <MhdTd>
        <div className="flex gap-3">
          <button type="button" onClick={onEdit} className="text-accent">
            Edit
          </button>
          {row.isDeleted ? (
            <button
              type="button"
              onClick={onRestore}
              disabled={pending}
              className="text-accent disabled:opacity-50"
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              onClick={onArchive}
              disabled={pending}
              className="text-accent disabled:opacity-50"
            >
              Archive
            </button>
          )}
        </div>
      </MhdTd>
    </MhdTr>
  );
}
