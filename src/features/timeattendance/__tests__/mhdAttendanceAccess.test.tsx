import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const { authState, reportsState, reportsHook } = vi.hoisted(() => ({
  authState: {
    current: null as unknown,
  },
  reportsState: {
    current: { data: undefined as unknown, isLoading: false },
  },
  reportsHook: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({ supabaseClient: { rpc: vi.fn() } }));

// Hook.ts imports these services for its query/mutation hooks. The access hook under test uses
// neither, and the real modules read app config (env) at import time, which a test must not need.
vi.mock('@/features/people/Service', () => ({ mhdPersonService: {} }));
vi.mock('@/features/conduct/Service', () => ({ mhdConductService: {} }));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => authState.current,
}));

vi.mock('@/features/people/Hook', () => ({
  useMhdDirectReports: (personId: string | null) => {
    reportsHook(personId);
    return reportsState.current;
  },
}));

const { useMhdAttendanceAccess } = await import('../Hook');

function signIn(roles: MhdAuthRoleName[], personId: string | null = 'person-self') {
  authState.current = {
    roles,
    profile: { companyId: 'company-1', personId, displayName: 'Dana Whitfield' },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  reportsState.current = { data: undefined, isLoading: false };
});

/**
 * The hook decides what the attendance pages render and which queries they run. It
 * mirrors the database predicate (migration 0335) but never grants anything: the RPCs
 * stay the authority. These tests pin the three scopes and, as importantly, that a
 * company-wide reader never pays for a direct-reports lookup it does not need.
 */
describe('useMhdAttendanceAccess', () => {
  it('gives the privileged set company scope with mutation rights', () => {
    signIn(['HR Partner']);
    const { result } = renderHook(() => useMhdAttendanceAccess());

    expect(result.current).toMatchObject({
      companyId: 'company-1',
      scope: 'company',
      canMutate: true,
      canReadAll: true,
      teamMembers: [],
      isScopeLoading: false,
    });
    // A company-wide reader never needs the reports lookup.
    expect(reportsHook).toHaveBeenCalledWith(null);
  });

  it('gives HR Coordinator company scope but no mutation rights', () => {
    signIn(['HR Coordinator']);
    const { result } = renderHook(() => useMhdAttendanceAccess());

    expect(result.current).toMatchObject({ scope: 'company', canMutate: false, canReadAll: true });
  });

  it('gives a manager team scope: themselves first, then their direct reports', () => {
    signIn(['Manager']);
    reportsState.current = {
      data: [
        { personId: 'report-1', displayName: 'Imani Brooks', jobTitle: null, referenceId: 'r1' },
        { personId: 'report-2', displayName: 'Mateo Alvarez', jobTitle: null, referenceId: 'r2' },
      ],
      isLoading: false,
    };
    const { result } = renderHook(() => useMhdAttendanceAccess());

    expect(result.current.scope).toBe('team');
    expect(result.current.canMutate).toBe(false);
    expect(result.current.canReadAll).toBe(false);
    expect(result.current.teamMembers).toEqual([
      { id: 'person-self', displayName: 'Dana Whitfield (me)' },
      { id: 'report-1', displayName: 'Imani Brooks' },
      { id: 'report-2', displayName: 'Mateo Alvarez' },
    ]);
    expect(reportsHook).toHaveBeenCalledWith('person-self');
  });

  it('scopes anyone with direct reports to their team, whatever their role label', () => {
    // Visibility follows the reporting line, not the role name.
    signIn(['Employee']);
    reportsState.current = {
      data: [
        { personId: 'report-1', displayName: 'Imani Brooks', jobTitle: null, referenceId: 'r1' },
      ],
      isLoading: false,
    };
    const { result } = renderHook(() => useMhdAttendanceAccess());

    expect(result.current.scope).toBe('team');
  });

  it('keeps an employee with no reports on their own record', () => {
    signIn(['Employee']);
    reportsState.current = { data: [], isLoading: false };
    const { result } = renderHook(() => useMhdAttendanceAccess());

    expect(result.current.scope).toBe('self');
    expect(result.current.teamMembers).toEqual([
      { id: 'person-self', displayName: 'Dana Whitfield (me)' },
    ]);
  });

  it('reports loading while the reports lookup is in flight, so a page does not flash the wrong scope', () => {
    signIn(['Manager']);
    reportsState.current = { data: undefined, isLoading: true };
    const { result } = renderHook(() => useMhdAttendanceAccess());

    expect(result.current.isScopeLoading).toBe(true);
    expect(result.current.scope).toBe('self');
  });

  it('never reports loading for a company-wide reader', () => {
    signIn(['HR Specialist']);
    reportsState.current = { data: undefined, isLoading: true };
    const { result } = renderHook(() => useMhdAttendanceAccess());

    expect(result.current.isScopeLoading).toBe(false);
  });

  it('has no person to scope to when the account is not linked to a person record', () => {
    signIn(['Employee'], null);
    const { result } = renderHook(() => useMhdAttendanceAccess());

    expect(result.current.selfPersonId).toBeNull();
    expect(result.current.teamMembers).toEqual([]);
    expect(result.current.isScopeLoading).toBe(false);
  });
});
