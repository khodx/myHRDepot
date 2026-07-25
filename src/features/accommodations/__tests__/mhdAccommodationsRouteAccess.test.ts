import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import {
  mhdAccommodationsCanSeeMedical,
  mhdAccommodationsIsPrivileged,
  mhdCanAccessRoute,
} from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Reasonable Accommodations module. The router
 * guard (MhdRoleGuardedRoute) enforces exactly `mhdCanAccessRoute`, so proving
 * the predicate here is proving the enforcement.
 *
 * Three boundaries matter, and they are three DIFFERENT widths:
 *
 * 1. Route reachability — the privileged set PLUS Client User. An employee must
 *    be able to open and follow their OWN interactive process; a request may be
 *    verbal and can never be conditioned on a form, so the self-service surface
 *    is a legal requirement, not a convenience. Case visibility is decided
 *    server-side by mhd_can_view_accommodation_case (privileged, or the case is
 *    the caller's own), and mhd_accommodation_case_create refuses 42501 when a
 *    non-privileged caller names anyone but themselves.
 * 2. Administration — Platform Admin / HR Partner / Client Admin. A Client Admin
 *    manages non-medical workflow facts.
 * 3. Medical content — Platform Admin / HR Partner ONLY. Client Admin is
 *    deliberately excluded even though it is otherwise privileged; this is the
 *    ADA/FEHA confidentiality partition and the narrowest gate in the module.
 */
describe('accommodations route access', () => {
  it('excludes Viewer from /accommodations and /accommodations/:caseId', () => {
    expect(mhdCanAccessRoute('/accommodations', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/accommodations/some-case-id', ['Viewer'])).toBe(false);
  });

  it('excludes Viewer from /leaves as well — neither domain admits a Viewer', () => {
    expect(mhdCanAccessRoute('/leaves', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/leaves/some-case-id', ['Viewer'])).toBe(false);
  });

  it('admits the privileged roles and Client User to the module and its detail sub-route', () => {
    for (const role of [
      'Platform Admin',
      'HR Partner',
      'Client Admin',
      'Client User',
    ] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/accommodations', [role])).toBe(true);
      // /accommodations/:caseId inherits the rule via the guard's prefix match.
      expect(mhdCanAccessRoute('/accommodations/some-case-id', [role])).toBe(true);
    }
  });

  it('mhdAccommodationsIsPrivileged is Platform Admin / HR Partner / Client Admin only', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdAccommodationsIsPrivileged([role])).toBe(true);
    }
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdAccommodationsIsPrivileged([role])).toBe(false);
    }
  });

  it('mhdAccommodationsCanSeeMedical is Platform Admin / HR Partner ONLY — Client Admin excluded', () => {
    for (const role of ['Platform Admin', 'HR Partner'] as MhdAuthRoleName[]) {
      expect(mhdAccommodationsCanSeeMedical([role])).toBe(true);
    }
    // The confidentiality partition: a Client Admin administers the workflow but
    // must never reveal a functional limitation or accommodation need.
    for (const role of ['Client Admin', 'Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdAccommodationsCanSeeMedical([role])).toBe(false);
    }
  });

  it('keeps the medical gate strictly narrower than the administrative gate', () => {
    // A regression here would silently widen medical access to Client Admin.
    expect(mhdAccommodationsIsPrivileged(['Client Admin'])).toBe(true);
    expect(mhdAccommodationsCanSeeMedical(['Client Admin'])).toBe(false);
  });
});
