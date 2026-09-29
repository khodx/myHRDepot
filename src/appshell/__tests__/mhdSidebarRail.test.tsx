import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
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

  it('marks the active route row with the white-alpha selected state', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    // Nav groups default collapsed — expand Work Tools to reach its items.
    await user.click(screen.getByRole('button', { name: /Work Tools/i }));

    const active = screen.getByRole('link', { name: 'Tasks' });
    // Inside the open white panel the active row is the navy pill.
    expect(active.className).toContain('bg-rail-panel-pill');
    const inactive = screen.getByRole('link', { name: 'Forms' });
    // Module rows inside the open white panel use the panel token set: dark
    // ink text and dark-alpha hover tints.
    expect(inactive.className).toContain('text-rail-panel-text');
    expect(inactive.className).toContain('hover:bg-rail-panel-tint-hover');
  });

  it('collapses to icon-only and persists under mhd:nav:rail', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    // Off the Dashboard route deliberately: Dashboard forces every group
    // collapsed regardless of the user's toggle, which would defeat the
    // manual "expand Work Tools" step below.
    const { container } = render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    // Nav groups default collapsed — expand Work Tools so "Tasks" is present
    // to assert on around the rail collapse/expand toggle below.
    await user.click(screen.getByRole('button', { name: /Work Tools/i }));

    await user.click(screen.getByRole('button', { name: 'Collapse navigation' }));

    expect(window.localStorage.getItem('mhd:nav:rail')).toBe('collapsed');
    const aside = container.querySelector('aside');
    expect(aside!.className).toContain('w-[72px]');
    // Labels disappear. Each category is a single icon (with a tooltip) that
    // links to its landing page; its modules live in a hover flyout.
    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
    const category = screen.getByRole('link', { name: 'Work Tools' });
    expect(category).toHaveAttribute('title', 'Work Tools');
    expect(category).toHaveAttribute('href', '/categories/work-tools');
    await user.hover(category);
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('href', '/tasks');
    await user.unhover(category);
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Expand navigation' }));
    expect(window.localStorage.getItem('mhd:nav:rail')).toBe('expanded');
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('defaults every group collapsed, and expanding one collapses the rest', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    // Off the Dashboard route deliberately: Dashboard forces every group
    // collapsed regardless of the user's toggle, which is its own behavior,
    // not what this test is exercising.
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    // Nothing stored yet: every group starts collapsed.
    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
    expect(screen.queryByText('People')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Work Tools/i }));
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.queryByText('People')).not.toBeInTheDocument();

    // Expanding People & Org collapses Work Tools back — only one open at a time.
    await user.click(screen.getByRole('button', { name: /People & Org/i }));
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();

    // Clicking the open group again collapses it, leaving none expanded.
    await user.click(screen.getByRole('button', { name: /People & Org/i }));
    expect(screen.queryByText('People')).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('mhd:nav:collapsed')!)).toEqual(
      expect.arrayContaining(['Work Tools', 'People & Org']),
    );
  });

  it('shows coming soon badges without changing nav link destinations', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Work Tools/i }));

    const tasksLink = screen.getByRole('link', { name: 'Tasks' });
    expect(tasksLink).toHaveAttribute('href', '/tasks');
    expect(within(tasksLink).queryByText('Coming Soon')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /People & Org/i }));

    const onboardingLink = screen.getByRole('link', { name: /Onboarding/i });
    expect(onboardingLink).toHaveAttribute('href', '/onboarding');
    expect(within(onboardingLink).getByText('Coming Soon')).toBeInTheDocument();
  });

  it('nests companion links while keeping them reachable in collapsed mode', async () => {
    // Checklists / My Checklists is used here (not Training / My Training)
    // because Checklists is privileged-only while My Checklists is roles:
    // 'ALL' — a Platform Admin genuinely qualifies for both, so nesting
    // actually renders for this pair. Training and My Training have fully
    // disjoint role sets and are deliberately NOT nested (see MhdSidebar.tsx).
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/checklists']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Talent/i }));

    const checklists = screen.getByRole('link', { name: 'Checklists' });
    expect(checklists).toHaveAttribute('href', '/checklists');
    const myChecklists = screen.getByRole('link', { name: 'My Checklists' });
    expect(myChecklists).toHaveAttribute('href', '/my-checklists');
    expect(myChecklists.className).toContain('pl-8');

    await user.click(screen.getByRole('button', { name: 'Collapse navigation' }));
    // Collapsed: the companion link is reachable from the category's flyout.
    await user.hover(screen.getByRole('link', { name: 'Talent' }));
    expect(screen.getByRole('link', { name: 'My Checklists' })).toHaveAttribute(
      'href',
      '/my-checklists',
    );
  });
});

describe('MhdSidebar category landing behavior', () => {
  it('links each category name to its landing page and expands it on click', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
        <LocationProbe />
      </MemoryRouter>,
    );

    const name = screen.getByRole('link', { name: 'Work Tools' });
    expect(name).toHaveAttribute('href', '/categories/work-tools');
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();

    await user.click(name);
    expect(screen.getByTestId('pathname')).toHaveTextContent('/categories/work-tools');
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    // The landing page itself is the active row; on the open white panel that
    // is the navy pill, not the rail's white one.
    expect(screen.getByRole('link', { name: 'Work Tools' }).className).toContain(
      'bg-rail-panel-pill',
    );
  });

  it('expands with the white inset panel and a guide line', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Expand Work Tools' }));
    const toggle = screen.getByRole('button', { name: 'Collapse Work Tools' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(toggle.getAttribute('aria-controls')!);
    expect(panel).not.toBeNull();
    expect(panel!.className).toContain('before:bg-rail-panel-line');
    expect(panel!.parentElement!.className).toContain('bg-rail-panel');
  });

  it('toggles from the chevron without navigating', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
        <LocationProbe />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Expand Work Tools' }));
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/tasks');

    await user.click(screen.getByRole('button', { name: 'Collapse Work Tools' }));
    expect(screen.queryByRole('link', { name: 'Forms' })).not.toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/tasks');
  });

  it('collapses instead of re-navigating when the name is clicked on its own landing page', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/categories/work-tools']}>
        <MhdSidebar />
        <LocationProbe />
      </MemoryRouter>,
    );

    // Arriving on the landing page opens its category in the rail.
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    // Already on the landing page, so a name click toggles rather than
    // navigating: it closes the panel, and the next click reopens it.
    await user.click(screen.getByRole('link', { name: 'Work Tools' }));
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Work Tools' }));
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Work Tools' }));
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();
    expect(screen.getByTestId('pathname')).toHaveTextContent('/categories/work-tools');
  });

  it('opens the arrived-at category and closes a stale one from an earlier visit', async () => {
    // The accordion keeps exactly one category open: here, Work Tools.
    window.localStorage.setItem(
      'mhd:nav:collapsed',
      JSON.stringify([
        'People & Org',
        'Time & Leave',
        'Talent',
        'Employee Relations',
        'Communications',
        'Automation',
        'Wizards',
        'Administration',
      ]),
    );
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/categories/talent']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    // Work Tools was left open by the stored choice; arriving at Talent's
    // landing page swaps it.
    expect(screen.getByRole('link', { name: 'Certificates' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();
  });

  it('links a single-module category straight to its module with no chevron', async () => {
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
    expect(screen.queryByRole('button', { name: /Automation/ })).not.toBeInTheDocument();
  });

  it('collapsed rail flyout opens on keyboard focus and closes on Escape', async () => {
    const user = userEvent.setup();
    const { MhdSidebar } = await import('../MhdSidebar');
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <MhdSidebar />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Collapse navigation' }));
    act(() => screen.getByRole('link', { name: 'Work Tools' }).focus());
    expect(screen.getByRole('link', { name: 'Tasks' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Work Tools Home' })).toHaveAttribute(
      'href',
      '/categories/work-tools',
    );

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('link', { name: 'Tasks' })).not.toBeInTheDocument();
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
