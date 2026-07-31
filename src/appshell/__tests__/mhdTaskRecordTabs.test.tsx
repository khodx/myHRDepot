import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

/**
 * Tab-visibility coverage for the Task Audit/History tab appended to
 * MhdTaskRecordTabs. The tab is client-side UX only — the actual
 * enforcement is the '/tasks/:taskId/audit' route rule in mhdRouteAccess.ts
 * and the RPC's own 42501 check — but a role that cannot reach the route
 * must not be offered a link to it either.
 */

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({ roles });
}

function renderTabs() {
  return render(
    <MemoryRouter>
      <MhdTaskRecordTabs taskId="task-1" active="detail" />
    </MemoryRouter>,
  );
}

const { MhdTaskRecordTabs } = await import('../components/MhdTaskRecordTabs');

describe('MhdTaskRecordTabs — Audit tab visibility', () => {
  it.each(['Platform Admin', 'HR Partner'] as MhdAuthRoleName[])(
    'shows the Audit tab, linked to /tasks/:taskId/audit, for %s',
    (role) => {
      mockAuth([role]);
      renderTabs();

      const audit = screen.getByRole('link', { name: 'Audit' });
      expect(audit).toBeInTheDocument();
      expect(audit).toHaveAttribute('href', '/tasks/task-1/audit');
    },
  );

  it.each(['Client Admin', 'Client User', 'Viewer'] as MhdAuthRoleName[])(
    'omits the Audit tab for %s',
    (role) => {
      mockAuth([role]);
      renderTabs();

      expect(screen.queryByRole('link', { name: 'Audit' })).not.toBeInTheDocument();
    },
  );

  it('still renders the always-present tabs regardless of role', () => {
    mockAuth(['Viewer']);
    renderTabs();

    expect(screen.getByRole('link', { name: 'Detail' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Activities' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Attachments' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reports' })).toBeInTheDocument();
  });
});
