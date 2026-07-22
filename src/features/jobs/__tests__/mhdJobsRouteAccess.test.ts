import { describe, expect, it } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import {
  mhdCanAccessRoute,
  mhdCanMutateJobs,
  mhdCanSeeJobPay,
} from '@/appshell/mhdRouteAccess';

/**
 * Route-exclusion coverage for the Job Descriptions surfaces. The router guard
 * (MhdRoleGuardedRoute) enforces exactly these predicates, so proving them here
 * is proving the enforcement.
 *
 * Two boundaries matter most:
 * - Viewer is excluded from EVERYTHING in this module — /jobs and /my-job alike.
 * - /my-job is a SEPARATE route from /jobs, not a filtered view. A Client User
 *   reaches /my-job and is refused /jobs; a privileged admin reaches /jobs and
 *   is refused /my-job. Neither can stand in for the other.
 */
describe('job descriptions route access', () => {
  it('excludes Viewer from /jobs and /my-job', () => {
    expect(mhdCanAccessRoute('/jobs', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/my-job', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/jobs/some-job-id', ['Viewer'])).toBe(false);
    expect(mhdCanAccessRoute('/jobs/competencies', ['Viewer'])).toBe(false);
  });

  it('admits every privileged role to /jobs and its sub-routes', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/jobs', [role])).toBe(true);
      expect(mhdCanAccessRoute('/jobs/some-job-id', [role])).toBe(true);
      expect(mhdCanAccessRoute('/jobs/competencies', [role])).toBe(true);
    }
  });

  it('keeps /my-job and /jobs separate: Client User has one, privileged roles the other', () => {
    // The employee gets /my-job and is refused the privileged list.
    expect(mhdCanAccessRoute('/my-job', ['Client User'])).toBe(true);
    expect(mhdCanAccessRoute('/jobs', ['Client User'])).toBe(false);
    expect(mhdCanAccessRoute('/jobs/some-job-id', ['Client User'])).toBe(false);
    // Privileged roles get the list and are refused the employee route.
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanAccessRoute('/my-job', [role])).toBe(false);
    }
  });

  it('mhdCanMutateJobs is Platform Admin / HR Partner / Client Admin only', () => {
    for (const role of ['Platform Admin', 'HR Partner', 'Client Admin'] as MhdAuthRoleName[]) {
      expect(mhdCanMutateJobs([role])).toBe(true);
    }
    for (const role of ['Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanMutateJobs([role])).toBe(false);
    }
  });

  it('mhdCanSeeJobPay is narrower — Platform Admin / HR Partner only, Client Admin excluded', () => {
    for (const role of ['Platform Admin', 'HR Partner'] as MhdAuthRoleName[]) {
      expect(mhdCanSeeJobPay([role])).toBe(true);
    }
    for (const role of ['Client Admin', 'Client User', 'Viewer'] as MhdAuthRoleName[]) {
      expect(mhdCanSeeJobPay([role])).toBe(false);
    }
  });
});
