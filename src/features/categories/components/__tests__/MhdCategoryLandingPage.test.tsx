import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Each test dynamically imports the full nav data after vi.resetModules(); under a full
// parallel run that first import can exceed the 5s default and bleed into the next test.
vi.setConfig({ testTimeout: 30_000 });

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

const mockUseMhdModuleAlerts = vi.fn();
vi.mock('@/features/module-alerts/Hook', () => ({
  useMhdModuleAlerts: () => mockUseMhdModuleAlerts(),
}));

function mockAlerts(counts: Record<string, number>) {
  mockUseMhdModuleAlerts.mockReturnValue({ counts, isLoading: false });
}

function mockRoles(roles: string[]) {
  mockUseMhdAuth.mockReturnValue({ isAuthenticated: true, roles, profile: null });
}

async function renderAt(path: string) {
  const { MhdCategoryLandingPage } = await import('../MhdCategoryLandingPage');
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/categories/:categorySlug" element={<MhdCategoryLandingPage />} />
        <Route path="/404" element={<div>not-found</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetModules();
  mockRoles(['Platform Admin']);
  mockAlerts({});
});

describe('MhdCategoryLandingPage', () => {
  it('lists the category description and a card linking to each module', async () => {
    await renderAt('/categories/work-tools');

    expect(screen.getByRole('heading', { name: 'Work Tools' })).toBeInTheDocument();
    expect(screen.getByText('Everyday tools for getting work done.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('href', '/tasks');
    expect(screen.getByRole('link', { name: 'Forms' })).toHaveAttribute('href', '/forms');
  });

  it('nests every sub-page as a chip on its parent module card', async () => {
    await renderAt('/categories/communications');

    for (const [name, href] of [
      ['Communications', '/communications'],
      ['Announcements', '/communications/announcements'],
      ['Messaging', '/communications/messaging'],
      ['Correspondence Inbox', '/communications/inbox'],
      ['Correspondence Routing', '/communications/routing'],
      ['System Alerts', '/communications/system-alerts'],
      ['Memorandums', '/memorandums'],
      ['My Memorandums', '/my-memorandums'],
    ]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  it('shows the dashboard-style attention badge on a module card and on a sub-page chip', async () => {
    mockAlerts({ '/forms': 2, '/forms/library': 1 });
    await renderAt('/categories/work-tools');

    expect(screen.getByRole('link', { name: 'Forms, 2 need attention' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Form Library, 1 needs attention' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
  });

  it('keeps the Coming Soon pill clear of the corner badge on the same card', async () => {
    mockAlerts({ '/offboarding': 7 });
    await renderAt('/categories/employee-relations');

    const card = screen.getByRole('link', { name: 'Offboarding, 7 need attention' });
    expect(within(card).getByText('Coming Soon')).toHaveClass('mr-9');
  });

  it('uses the shared module card (row tone, border, animation hooks)', async () => {
    await renderAt('/categories/work-tools');

    // Tasks carries a sub-page chip, so its link sits inside the card element.
    const card = screen
      .getByRole('link', { name: 'Tasks' })
      .closest('.mhd-module-card') as HTMLElement;
    expect(card).not.toBeNull();
    expect(card.style.getPropertyValue('--tone')).toBe('var(--mhd-module-tone-1)');
  });

  it('searches within the category only', async () => {
    const user = userEvent.setup();
    await renderAt('/categories/work-tools');

    await user.type(screen.getByRole('textbox', { name: 'Search Work Tools' }), 'calculator');

    expect(screen.getByRole('link', { name: 'Calculator' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();
  });

  it('lists companion pages in other categories too', async () => {
    await renderAt('/categories/talent');

    expect(screen.getByRole('link', { name: 'Checklists' })).toHaveAttribute('href', '/checklists');
    expect(screen.getByRole('link', { name: 'My Checklists' })).toHaveAttribute(
      'href',
      '/my-checklists',
    );
  });

  it('sends a role with nothing in the category to not-found, like any refused route', async () => {
    mockRoles(['Viewer']);
    await renderAt('/categories/administration');

    expect(screen.queryByRole('link', { name: 'Admin Settings' })).not.toBeInTheDocument();
    expect(screen.getByText('not-found')).toBeInTheDocument();
  });

  it('only lists the modules the role can open', async () => {
    mockRoles(['HR Partner']);
    await renderAt('/categories/administration');

    expect(screen.getByRole('link', { name: 'Admin Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Lab & Sandbox' })).not.toBeInTheDocument();
  });

  it('redirects an unknown category to the not-found page', async () => {
    await renderAt('/categories/not-a-category');
    expect(screen.getByText('not-found')).toBeInTheDocument();
  });
});
