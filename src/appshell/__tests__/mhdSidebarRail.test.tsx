import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';

/**
 * Rail presentation contract (myHRDepot Category Theme Specification):
 * the whole sidebar consumes the category rail tokens, the active row uses the
 * white-alpha selected state, the rail collapses to icon-only 72px with its own
 * persistence key, and the mobile drawer traps focus / closes on Escape.
 */

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

function mockAuth(roles: string[] = ['Platform Admin']) {
  mockUseMhdAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    userEmail: 'user@fixtures.myhr.local',
    authUserId: 'auth-user-1',
    roles,
    profile: {
      companyName: 'Fixture Company 01',
      displayName: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      roleNames: roles,
    },
    signOut: vi.fn(),
  });
}

/* This jsdom environment ships without window.localStorage (the sidebar code
   guards every access) — install an in-memory stand-in so persistence is
   observable in tests. */
function installLocalStorageStub() {
  const store = new Map<string, string>();
  const stub = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(window, 'localStorage', { value: stub, configurable: true });
}

/** Surfaces the router's current pathname so navigation can be asserted. */
function LocationProbe() {
  return <span data-testid="pathname">{useLocation().pathname}</span>;
}

beforeEach(() => {
  vi.resetModules();
  installLocalStorageStub();
  mockAuth();
});

describe('MhdSidebar rail', () => {
  it('renders the rail with category tokens and the company card', async () => {
    const { MhdSidebar } = await import('../MhdSidebar');
    const { container } = render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    const aside = container.querySelector('aside');
    expect(aside).not.toBeNull();
    expect(aside!.className).toContain('bg-rail');
    expect(aside!.className).toContain('border-rail-border');
    expect(aside!.className).toContain('w-[329.13px]');
    expect(screen.getByText('Fixture Company 01')).toBeInTheDocument();
    expect(screen.getByText('myHRDepot')).toBeInTheDocument();
  });

  it('lists only Dashboard and the categories, with no expansion controls or module rows', async () => {
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Work Tools' })).toHaveAttribute(
      'href',
      '/categories/work-tools',
    );
    expect(screen.getByRole('link', { name: 'Talent' })).toHaveAttribute(
      'href',
      '/categories/talent',
    );
    // Even while standing on a module, the rail never lists modules or sub-pages.
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My Checklists' })).not.toBeInTheDocument();
    // No chevron / expand toggles; the only button is the rail collapse toggle.
    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Collapse navigation',
    ]);
    expect(document.querySelector('[aria-expanded]')).toBeNull();
  });

  it('lights the category for its landing page and for every module page inside it', async () => {
    const { MhdSidebar } = await import('../MhdSidebar');
    const cases: Array<[string, string, string]> = [
      ['/categories/work-tools', 'Work Tools', 'Talent'],
      ['/tasks', 'Work Tools', 'Talent'],
      ['/forms/library', 'Work Tools', 'People & Org'],
      ['/leaves/policy-library', 'Time & Leave', 'Work Tools'],
      ['/my-checklists', 'Talent', 'Time & Leave'],
    ];
    for (const [path, activeLabel, inactiveLabel] of cases) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <MhdSidebar />
        </MemoryRouter>,
      );
      expect(screen.getByRole('link', { name: activeLabel }).className, path).toContain(
        'bg-rail-selected',
      );
      const inactive = screen.getByRole('link', { name: inactiveLabel });
      expect(inactive.className, path).not.toContain('bg-rail-selected');
      expect(inactive.className).toContain('hover:bg-rail-hover');
      unmount();
    }
  });

  it('navigates to the category landing page on click', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('link', { name: 'Work Tools' }));
    expect(screen.getByTestId('pathname')).toHaveTextContent('/categories/work-tools');
    // Still a flat rail on the landing page: nothing expands.
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();
  });

  it('collapses to icon-only and persists under mhd:nav:rail', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    const { container } = render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Collapse navigation' }));

    expect(window.localStorage.getItem('mhd:nav:rail')).toBe('collapsed');
    const aside = container.querySelector('aside');
    expect(aside!.className).toContain('w-[72px]');
    // Labels disappear; each category is a single icon with a tooltip that
    // links to its landing page. There is no hover flyout.
    expect(screen.queryByText('Work Tools')).not.toBeInTheDocument();
    const category = screen.getByRole('link', { name: 'Work Tools' });
    expect(category).toHaveAttribute('title', 'Work Tools');
    expect(category).toHaveAttribute('href', '/categories/work-tools');
    await user.hover(category);
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand navigation' }));
    expect(window.localStorage.getItem('mhd:nav:rail')).toBe('expanded');
    expect(screen.getByText('Work Tools')).toBeInTheDocument();
  });

  it('links a single-module category straight to its module', async () => {
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Automation' })).toHaveAttribute(
      'href',
      '/automations',
    );
  });

  it('hides a category the role cannot open anything in', async () => {
    mockAuth(['Viewer']);
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('link', { name: 'Administration' })).not.toBeInTheDocument();
  });
});

describe('MhdMobileNavDrawer', () => {
  it('renders as a modal dialog with the rail tokens and closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { MhdMobileNavDrawer } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdMobileNavDrawer onClose={onClose} />
      </MemoryRouter>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Navigation' });
    expect(dialog.className).toContain('bg-rail');
    // Focus moved inside the drawer on mount.
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the close button and restores focus to the prior element', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    // Simulate the hamburger trigger holding focus before the drawer opens.
    const trigger = document.createElement('button');
    trigger.textContent = 'open-nav';
    document.body.appendChild(trigger);
    trigger.focus();

    const { MhdMobileNavDrawer } = await import('../MhdSidebar');
    const { unmount } = render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdMobileNavDrawer onClose={onClose} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Close navigation' }));
    expect(onClose).toHaveBeenCalled();

    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
