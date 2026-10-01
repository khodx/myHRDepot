import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdKbArticle } from '../Hook';
import { MhdKbBadges } from './MhdKbBadges';
import { MhdKbArticleBody } from './MhdKbArticleBody';

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
      <MhdKbBadges
        articleType={article.data.articleType}
        companyId={article.data.companyId}
        accessLevel={article.data.accessLevel}
      />
      {article.data.summary ? (
        <p className="text-base text-muted-foreground">{article.data.summary}</p>
      ) : null}
      <MhdKbArticleBody body={article.data.body} bodyFormat={article.data.bodyFormat} />
    </article>
  );
}
