import { describe, expect, it } from 'vitest';
import { mhdKbArticleMatchesPath } from '../RouteContext';

function withRoutes(...routeContext: string[]) {
  return { routeContext };
}

describe('mhdKbArticleMatchesPath', () => {
  it('matches an exact path only', () => {
    expect(mhdKbArticleMatchesPath(withRoutes('/leaves'), '/leaves')).toBe(true);
    expect(mhdKbArticleMatchesPath(withRoutes('/leaves'), '/leaves/123')).toBe(false);
  });

  it('treats a wildcard as the page itself and everything below it', () => {
    const article = withRoutes('/leaves/*');

    expect(mhdKbArticleMatchesPath(article, '/leaves')).toBe(true);
    expect(mhdKbArticleMatchesPath(article, '/leaves/123')).toBe(true);
    expect(mhdKbArticleMatchesPath(article, '/leaves/123/intake')).toBe(true);
  });

  it('does not match a sibling that merely shares a prefix', () => {
    const article = withRoutes('/leaves/*');

    expect(mhdKbArticleMatchesPath(article, '/leaves-archive')).toBe(false);
    expect(mhdKbArticleMatchesPath(article, '/leaf')).toBe(false);
  });

  it('matches when any one entry matches and never when there are none', () => {
    expect(mhdKbArticleMatchesPath(withRoutes('/a', '/b/*'), '/b/c')).toBe(true);
    expect(mhdKbArticleMatchesPath(withRoutes(), '/anything')).toBe(false);
  });
});
