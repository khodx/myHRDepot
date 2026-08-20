import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { mhdCanAccessRoute } from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for Task Audit/History. The router guard
 * (MhdRoleGuardedRoute) enforces exactly `mhdCanAccessRoute`, so proving the
 * predicate here is proving the enforcement — the tab's client-side hiding
 * in MhdTaskRecordTabs and the RPC's own 42501 check
 * (mhd_assert_task_audit_timeline_access) are UX/defense-in-depth, not this
 * test's subject.
 *
 * `/tasks/:taskId/audit` is the sole /tasks sub-route NOT open to 'ALL': it
 * is restricted to Platform Admin / HR Partner, and its rule MUST precede
 * the general '/tasks' ('ALL') rule in MHD_ROUTE_ACCESS so the prefix match
 * on '/tasks' never swallows it first.
 */
describe('task audit route access', () => {
  it('admits Platform Admin and HR Partner to /tasks/:taskId/audit', () => {
    for (const role of ['Platform Admin', 'HR Partner'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/tasks/task-1/audit', [role])).toBe(true);
    }
  });

  it('excludes Client Admin, Client User, and Viewer from /tasks/:taskId/audit', () => {
    for (const role of ['Client Admin', 'Employee', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/tasks/task-1/audit', [role])).toBe(false);
    }
  });

  it('still admits every role to /tasks/:taskId itself — the segment-pattern rule does not regress the general "ALL" /tasks rule', () => {
    // Without the ':taskId/audit' suffix, this path must resolve via the
    // general '/tasks' rule (roles: 'ALL'), not the new segment-pattern rule,
    // which is exact-length and requires the trailing '/audit' segment.
    for (const role of [
      'Platform Admin',
      'HR Partner',
      'Client Admin',
      'Employee',
      'Viewer',
    ] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/tasks/task-1', [role])).toBe(true);
    }
    // And the bare /tasks list route is unaffected too.
    expect(mhdCanAccessRoute('/tasks', ['Viewer'])).toBe(true);
  });

  it('does not let the segment-pattern rule match a differently-shaped path of the same length', () => {
    // '/tasks/:taskId/audit' requires the literal 'audit' final segment — a
    // same-length path with a different final segment (e.g. '/tasks/task-1/notes')
    // must fall through to the general '/tasks' ('ALL') rule instead.
    expect(mhdCanAccessRoute('/tasks/task-1/notes', ['Viewer'])).toBe(true);
  });
});
