import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const { mockUseMhdAuth } = vi.hoisted(() => ({ mockUseMhdAuth: vi.fn() }));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

// Heavy subcomponents with their own large dependency trees are stubbed out
// so this test stays focused on what MhdAppShell itself is responsible for:
// wrapping every authenticated route in MhdAssistantProvider so the
// navigation assistant is reachable regardless of which page is showing.
vi.mock('../MhdSidebar', () => ({
  MhdSidebar: () => <nav data-testid="sidebar" />,
  MhdMobileNavDrawer: () => null,
}));
vi.mock('../MhdTopBar', () => ({
  MhdTopBar: () => <div data-testid="topbar" />,
}));

function mockAuth(roles: MhdAuthRoleName[] = ['HR Partner']) {
  mockUseMhdAuth.mockReturnValue({
    roles,
    profile: { impersonation: { isImpersonating: false } },
    endImpersonation: vi.fn(),
  });
}

async function renderShellAt(path: string) {
  const { MhdAppShell } = await import('../MhdAppShell');
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<MhdAppShell />}>
          <Route path={path} element={<div>Page content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth();
});

describe('MhdAppShell', () => {
  it.each(['/dashboard', '/leaves', '/employees'])(
    'renders the navigation assistant launcher on %s',
    async (path) => {
      await renderShellAt(path);

      expect(screen.getByRole('button', { name: 'Open navigation assistant' })).toBeInTheDocument();
    },
  );
});
