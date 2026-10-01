import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPaginationControls } from '@/components/ui/MhdPagination';
import { mhdPaginationSummary, useMhdPagination } from '@/components/ui/MhdPaginationUtils';
import { MhdTable, MhdTableFooter, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import {
  useMhdArchiveKbArticle,
  useMhdCreateKbArticle,
  useMhdKbArticleAdmin,
  useMhdKbArticlesAdmin,
  useMhdPublishKbArticle,
  useMhdRestoreKbArticle,
  useMhdUpdateKbArticle,
} from '../Hook';
import type { MhdKbArticleAdminListItem, MhdKbArticleType } from '../Types';
import {
  MHD_KB_ACCESS_LEVEL_LABELS,
  MHD_KB_ARTICLE_TYPE_LABELS,
  MHD_KB_COMPANY_ACCESS_LEVELS,
  MHD_KB_PLATFORM_ACCESS_LEVELS,
} from '../Types';
import type { MhdKbArticleFormValues } from '../Schemas';
import { MhdKbArticleForm } from './MhdKbArticleForm';

interface Props {
  scope: 'PLATFORM' | 'COMPANY';
  companyId: string | null;
}

type Dialog = { id?: string } | null;

export function MhdKbArticleManager({ scope, companyId }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [accessLevel, setAccessLevel] = useState('');
  const [articleType, setArticleType] = useState('');
  const [dialog, setDialog] = useState<Dialog>(null);
  const articles = useMhdKbArticlesAdmin({
    searchTerm: search,
    status,
    scope,
    companyId: companyId ?? undefined,
    articleType: (articleType || undefined) as MhdKbArticleType | undefined,
  });
  const articleDetail = useMhdKbArticleAdmin(dialog?.id ?? null);
  const createArticle = useMhdCreateKbArticle();
  const updateArticle = useMhdUpdateKbArticle();
  const publish = useMhdPublishKbArticle();
  const archive = useMhdArchiveKbArticle();
  const restore = useMhdRestoreKbArticle();
  const accessLevels =
    scope === 'PLATFORM' ? MHD_KB_PLATFORM_ACCESS_LEVELS : MHD_KB_COMPANY_ACCESS_LEVELS;
  const items = (articles.data?.items ?? []).filter(
    (item) =>
      (status !== 'archived' || item.isDeleted) &&
      (!accessLevel || item.accessLevel === accessLevel),
  );
  const pagination = useMhdPagination(items.length, {
    resetKey: `articles:${search}:${status}:${accessLevel}:${articleType}:${scope}:${companyId}`,
  });
  const mutationError = [createArticle, updateArticle, publish, archive, restore].find(
    (mutation) => mutation.error,
  )?.error;

  async function saveArticle(values: MhdKbArticleFormValues) {
    const input = {
      categoryId: values.categoryId,
      slug: scope === 'PLATFORM' ? values.slug : undefined,
      title: values.title,
      summary: values.summary,
      body: values.body,
      accessLevel: values.accessLevel,
      companyId: scope === 'PLATFORM' ? null : companyId,
      articleType: values.articleType,
      bodyFormat: 'rich' as const,
      routeContext: values.routeContext
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      searchKeywords: values.searchKeywords,
      complianceRegistryId: scope === 'PLATFORM' ? values.complianceRegistryId || null : null,
    };
    if (articleDetail.data) {
      await updateArticle.mutateAsync({ ...input, articleId: articleDetail.data.id });
    } else {
      await createArticle.mutateAsync(input);
    }
    setDialog(null);
  }

  return (
    <div className="space-y-4">
      {mutationError ? (
        <p
          role="alert"
          className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {mutationError instanceof Error ? mutationError.message : 'Unable to save content.'}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button onClick={() => setDialog({})}>New Article</Button>
      </div>
      <MhdFilterBar>
        <MhdFilterInput
          label="Search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search articles"
        />
        <MhdFilterSelect
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </MhdFilterSelect>
        <MhdFilterSelect
          label="Access Level"
          value={accessLevel}
          onChange={(event) => setAccessLevel(event.target.value)}
        >
          <option value="">All Access Levels</option>
          {accessLevels.map((level) => (
            <option key={level} value={level}>
              {MHD_KB_ACCESS_LEVEL_LABELS[level]}
            </option>
          ))}
        </MhdFilterSelect>
        <MhdFilterSelect
          label="Type"
          value={articleType}
          onChange={(event) => setArticleType(event.target.value)}
        >
          <option value="">All</option>
          <option value="ARTICLE">Articles</option>
          <option value="FAQ">FAQs</option>
        </MhdFilterSelect>
      </MhdFilterBar>
      {articles.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Title</MhdTh>
                <MhdTh>Type</MhdTh>
                <MhdTh>Access Level</MhdTh>
                <MhdTh>Status</MhdTh>
                <MhdTh>Updated</MhdTh>
                <MhdTh>Actions</MhdTh>
              </tr>
            </thead>
            <tbody>
              {pagination.sliceItems(items).map((row) => (
                <ArticleRow
                  key={row.id}
                  row={row}
                  onEdit={() => setDialog({ id: row.id })}
                  onPublish={() => void publish.mutateAsync(row.id)}
                  onArchive={() => void archive.mutateAsync(row.id)}
                  onRestore={() => void restore.mutateAsync(row.id)}
                  pending={publish.isPending || archive.isPending || restore.isPending}
                />
              ))}
            </tbody>
          </MhdTable>
          <MhdTableFooter summary={mhdPaginationSummary(pagination, items.length, 'articles')}>
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
        </MhdCard>
      )}
      {dialog ? (
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
              scope={scope}
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
  row: MhdKbArticleAdminListItem;
  onEdit: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onRestore: () => void;
  pending: boolean;
}) {
  return (
    <MhdTr>
      <MhdTd className="font-medium">{row.title}</MhdTd>
      <MhdTd>{MHD_KB_ARTICLE_TYPE_LABELS[row.articleType]}</MhdTd>
      <MhdTd>{MHD_KB_ACCESS_LEVEL_LABELS[row.accessLevel]}</MhdTd>
      <MhdTd>
        <div className="flex items-center gap-2">
          <span>
            {row.isDeleted ? 'Archived' : row.status === 'published' ? 'Published' : 'Draft'}
          </span>
          {row.complianceRegistryId ? (
            <MhdBadge variant="neutral" hideIcon>
              Regulated
            </MhdBadge>
          ) : null}
        </div>
      </MhdTd>
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
            <>
              {row.status === 'draft' ? (
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={pending}
                  className="text-accent"
                >
                  Publish
                </button>
              ) : null}
              <button type="button" onClick={onArchive} disabled={pending} className="text-accent">
                Archive
              </button>
            </>
          )}
        </div>
      </MhdTd>
    </MhdTr>
  );
}
