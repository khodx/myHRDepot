import { MhdBadge } from '@/components/ui/MhdBadge';
import {
  MHD_KB_ACCESS_LEVEL_LABELS,
  MHD_KB_ARTICLE_TYPE_LABELS,
  type MhdKbAccessLevel,
  type MhdKbArticleType,
} from '../Types';

export function MhdKbArticleTypeBadge({ articleType }: { articleType: MhdKbArticleType }) {
  return <MhdBadge variant="accent">{MHD_KB_ARTICLE_TYPE_LABELS[articleType]}</MhdBadge>;
}

export function MhdKbCompanyBadge({ companyId }: { companyId: string | null }) {
  return companyId ? <MhdBadge variant="info">Your Company</MhdBadge> : null;
}

export function MhdKbAccessLevelBadge({ accessLevel }: { accessLevel: MhdKbAccessLevel }) {
  if (accessLevel !== 'LEADERSHIP' && accessLevel !== 'ADMIN') return null;

  return <MhdBadge variant="neutral">{MHD_KB_ACCESS_LEVEL_LABELS[accessLevel]}</MhdBadge>;
}

export function MhdKbBadges({
  articleType,
  companyId,
  accessLevel,
}: {
  articleType: MhdKbArticleType;
  companyId: string | null;
  accessLevel: MhdKbAccessLevel;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <MhdKbArticleTypeBadge articleType={articleType} />
      <MhdKbCompanyBadge companyId={companyId} />
      <MhdKbAccessLevelBadge accessLevel={accessLevel} />
    </div>
  );
}
