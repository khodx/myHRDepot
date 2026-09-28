import { describe, expect, it } from 'vitest';
import { mhdSearchNavigation } from '../Service';

describe('mhdSearchNavigation', () => {
  it('returns no results for an empty query', () => {
    expect(mhdSearchNavigation('   ', ['Employee'])).toEqual([]);
  });

  it('returns the route for a label match', () => {
    expect(mhdSearchNavigation('Leaves', ['Employee']).some((match) => match.route === '/leaves')).toBe(true);
  });

  it('returns the route for a keyword-only match', () => {
    expect(mhdSearchNavigation('maternity leave', ['Employee']).some((match) => match.route === '/leaves')).toBe(true);
  });

  it('never returns a matched route the role cannot access', () => {
    expect(mhdSearchNavigation('employee files', ['Employee']).some((match) => match.route === '/employees')).toBe(false);
  });

  it('caps results at five and sorts by descending score', () => {
    const results = mhdSearchNavigation('HR', ['Platform Admin']);

    expect(results).toHaveLength(5);
    expect(results.every((result, index) => index === 0 || result.score <= results[index - 1].score)).toBe(true);
  });
});
