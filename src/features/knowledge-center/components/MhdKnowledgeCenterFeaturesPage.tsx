import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { MhdBadge } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterInput } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '@/features/authentication/Hook';
import { useMhdDebouncedValue } from '@/utils/useMhdDebouncedValue';
import { NAV_SECTIONS } from '@/appshell/mhdNavSections';
import {
  attachRelatedArticles,
  buildFeatureCatalog,
  filterFeatureCatalog,
  type MhdFeatureCatalogFeature,
} from '../FeatureCatalog';
import { useMhdKbPublishedArticleRoutes } from '../Hook';

function FeatureLink({ feature }: { feature: MhdFeatureCatalogFeature }) {
  const canLink = feature.accessible && feature.status === 'live';

  return canLink ? (
    <Link to={feature.route} className="font-semibold text-accent hover:text-accent-hover">
      {feature.label}
    </Link>
  ) : (
    <span className="font-semibold text-foreground">{feature.label}</span>
  );
}

function FeatureStatus({ feature }: { feature: MhdFeatureCatalogFeature }) {
  return (
    <span className="flex flex-wrap gap-2">
      {!feature.accessible ? (
        <MhdBadge variant="neutral" hideIcon>
          Restricted
        </MhdBadge>
      ) : null}
      {feature.status === 'comingSoon' ? (
        <MhdBadge variant="info" hideIcon>
          Coming Soon
        </MhdBadge>
      ) : null}
    </span>
  );
}

function FeatureChildren({ children }: { children: MhdFeatureCatalogFeature[] }) {
  if (children.length === 0) return null;

  return (
    <ul className="space-y-2 border-l border-border pl-4 text-sm">
      {children.map((child) => (
        <li key={child.route} className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <FeatureLink feature={child} />
            <FeatureStatus feature={child} />
          </div>
          <p className="text-muted-foreground">{child.description}</p>
        </li>
      ))}
    </ul>
  );
}

function RelatedArticles({ feature }: { feature: MhdFeatureCatalogFeature }) {
  if (!feature.relatedArticles?.length) return null;

  return (
    <p className="text-sm text-muted-foreground">
      Help:{' '}
      {feature.relatedArticles.map((article, index) => (
        <span key={article.id}>
          {index > 0 ? ', ' : null}
          <Link
            to={`/knowledge-center/articles/${article.slug}`}
            className="text-accent hover:text-accent-hover"
          >
            {article.title}
          </Link>
        </span>
      ))}
    </p>
  );
}

export function MhdKnowledgeCenterFeaturesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [draftQuery, setDraftQuery] = useState(query);
  const [includeRestricted, setIncludeRestricted] = useState(false);
  const debouncedQuery = useMhdDebouncedValue(draftQuery);
  const { roles } = useMhdAuth();
  const articles = useMhdKbPublishedArticleRoutes();

  const catalog = useMemo(
    () =>
      buildFeatureCatalog(NAV_SECTIONS, roles, {
        includeRestricted,
      }),
    [includeRestricted, roles],
  );
  const filteredCatalog = useMemo(() => {
    const filtered = filterFeatureCatalog(catalog, debouncedQuery);
    return articles.data ? attachRelatedArticles(filtered, articles.data) : filtered;
  }, [articles.data, catalog, debouncedQuery]);

  function updateQuery(value: string) {
    setDraftQuery(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('q', value);
    else next.delete('q');
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Feature Catalog"
        description="Everything myHRDepot can do, grouped the way the sidebar groups it."
      />
      <div className="space-y-4">
        <MhdFilterInput
          label="Search Feature Catalog"
          value={draftQuery}
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Search features and capabilities"
        />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={includeRestricted}
            onChange={(event) => setIncludeRestricted(event.target.checked)}
            className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
          />
          Include Features Outside My Role
        </label>
      </div>
      {filteredCatalog.length === 0 ? (
        <MhdEmptyState
          icon={Search}
          title="No features found"
          description="Try a different search or include features outside your role."
        />
      ) : (
        <div className="space-y-8">
          {filteredCatalog.map((section) => (
            <section key={section.label} className="space-y-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground">{section.label}</h2>
                {section.description ? (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {section.features.map((feature) => (
                  <MhdCard key={feature.route} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <FeatureLink feature={feature} />
                      <FeatureStatus feature={feature} />
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                    <FeatureChildren children={feature.children} />
                    <RelatedArticles feature={feature} />
                  </MhdCard>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
