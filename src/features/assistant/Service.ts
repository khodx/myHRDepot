import { NAV_SECTIONS } from '@/appshell/mhdNavSections';
import { mhdCanAccessRoute } from '@/appshell/mhdRouteAccess';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdAssistantCandidate, MhdAssistantMatch } from './Types';

function flattenNavigation(): MhdAssistantCandidate[] {
  const candidates: MhdAssistantCandidate[] = [];

  const addItem = (item: MhdAssistantCandidate & { children?: MhdAssistantCandidate[] }) => {
    candidates.push(item);
    item.children?.forEach(addItem);
  };

  NAV_SECTIONS.forEach((section) => section.items.forEach(addItem));
  return candidates;
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scoreCandidate(candidate: MhdAssistantCandidate, query: string): number {
  const searchableText = normalize(
    [candidate.label, candidate.description, ...(candidate.keywords ?? [])].join(' '),
  );
  const queryText = normalize(query);
  const queryTokens = queryText.split(/\s+/).filter(Boolean);

  let score = searchableText.includes(queryText) ? 3 : 0;
  const searchableWords = searchableText.split(' ');
  for (const token of queryTokens) {
    if (searchableWords.includes(token)) score += 2;
    // A short token (e.g. "no", "at") as a bare substring produces false
    // positives inside unrelated words ("no" inside "notice",
    // "announcements") — only fall back to substring matching once the
    // token is long enough that an accidental containment is unlikely.
    else if (token.length >= 4 && searchableText.includes(token)) score += 1;
  }
  return score;
}

export function mhdSearchNavigation(
  query: string,
  userRoles: MhdAuthRoleName[],
): MhdAssistantMatch[] {
  if (!query.trim()) return [];

  return flattenNavigation()
    .filter((candidate) => mhdCanAccessRoute(candidate.route, userRoles))
    .map((candidate, index) => ({
      candidate,
      index,
      score: scoreCandidate(candidate, query),
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .slice(0, 5)
    .map(({ candidate, score }) => ({
      label: candidate.label,
      description: candidate.description,
      route: candidate.route,
      score,
    }));
}
