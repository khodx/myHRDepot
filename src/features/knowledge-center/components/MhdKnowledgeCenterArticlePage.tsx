import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdKbArticle } from '../Hook';

export function MhdKnowledgeCenterArticlePage() {
  const navigate = useNavigate();
  const { slug = '' } = useParams<{ slug: string }>();
  const article = useMhdKbArticle(slug);

  if (article.isLoading) return <p className="text-sm text-muted-foreground">Loading article…</p>;

  if (!article.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Article not found.</p>
        <Button variant="secondary" onClick={() => navigate('/knowledge-center')}>
          Back to Knowledge Center
        </Button>
      </div>
    );
  }

  return (
    <article className="space-y-6">
      <MhdPageHeader
        title={article.data.title}
        backTo="/knowledge-center"
        backLabel="Knowledge Center"
      />
      {article.data.summary ? (
        <p className="text-base text-muted-foreground">{article.data.summary}</p>
      ) : null}
      <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-6 text-sm leading-7 text-foreground">
        {article.data.body}
      </div>
    </article>
  );
}
