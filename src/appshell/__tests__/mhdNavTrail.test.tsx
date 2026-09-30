import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NAV_SECTIONS } from '../mhdNavSections';
import { MhdBreadcrumb } from '../components/MhdBreadcrumb';
import { mhdNavTrailBefore, mhdNavTrailForRoute } from '../mhdNavTrail';

/**
 * The rail lists categories only, so the trail is how a module page shows
 * where it sits and links back to its category landing page.
 */
describe('mhdNavTrailForRoute', () => {
  it('trails a module route as category › module', () => {
    expect(mhdNavTrailForRoute('/leaves')).toEqual([
      { label: 'Time & Leave', to: '/categories/time-leave' },
      { label: 'Leaves' },
    ]);
  });

  it('trails a companion sub-page as category › parent module › page', () => {
    expect(mhdNavTrailForRoute('/leaves/policy-library')).toEqual([
      { label: 'Time & Leave', to: '/categories/time-leave' },
      { label: 'Leaves', to: '/leaves' },
      { label: 'Leave Policy Library' },
    ]);
  });

  it('has no trail for the landing page, the dashboard, record pages or single-module categories', () => {
    expect(mhdNavTrailForRoute('/categories/time-leave')).toBeUndefined();
    expect(mhdNavTrailForRoute('/dashboard')).toBeUndefined();
    expect(mhdNavTrailForRoute('/people/some-record-id')).toBeUndefined();
    expect(mhdNavTrailForRoute('/automations')).toBeUndefined();
  });

  it('resolves every nav destination in a category that has a landing page', () => {
    for (const section of NAV_SECTIONS.filter((s) => s.route)) {
      for (const item of section.items) {
        for (const nav of [item, ...(item.children ?? [])]) {
          const trail = mhdNavTrailForRoute(nav.route);
          expect(trail, `${section.label} > ${nav.label}`).toBeDefined();
          expect(trail![0]).toEqual({ label: section.label, to: section.route });
          expect(trail!.at(-1)).toEqual({ label: nav.label });
        }
      }
    }
  });

  it('gives the crumbs preceding a route, or none for a non-nav route', () => {
    expect(mhdNavTrailBefore('/people')).toEqual([
      { label: 'People & Org', to: '/categories/people-org' },
    ]);
    expect(mhdNavTrailBefore('/somewhere-else')).toEqual([]);
  });
});

describe('MhdBreadcrumb category prefix', () => {
  it('prefixes a record trail with the category landing link', () => {
    render(
      <MemoryRouter>
        <MhdBreadcrumb items={[{ label: 'People', to: '/people' }, { label: 'Jordan Reyes' }]} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'People & Org' })).toHaveAttribute(
      'href',
      '/categories/people-org',
    );
    expect(screen.getByRole('link', { name: 'People' })).toHaveAttribute('href', '/people');
    expect(screen.getByText('Jordan Reyes')).toBeInTheDocument();
  });

  it('leaves a trail whose lead is not a nav module untouched', () => {
    render(
      <MemoryRouter>
        <MhdBreadcrumb items={[{ label: 'Elsewhere', to: '/elsewhere' }, { label: 'Thing' }]} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'People & Org' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Elsewhere' })).toBeInTheDocument();
  });
});
