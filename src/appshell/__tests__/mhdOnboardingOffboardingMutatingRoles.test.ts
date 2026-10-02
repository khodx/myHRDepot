import { describe, expect, it } from 'vitest';
import {
  MHD_OFFBOARDING_MUTATING_ROLES,
  MHD_ONBOARDING_MUTATING_ROLES,
  mhdCanMutateOffboarding,
  mhdCanMutateOnboarding,
} from '../mhdRouteAccess';

// The server accepts exactly these four roles for every onboarding and offboarding mutation (0361).
// The app used to also offer the mutating affordances to Executive Leadership and Director, whose
// actions the server then refused.
const SERVER_ACCEPTED = ['Platform Admin', 'HR Partner', 'HR Admin', 'Client Admin'] as const;

describe('onboarding and offboarding mutating roles', () => {
  it.each([
    ['onboarding', MHD_ONBOARDING_MUTATING_ROLES, mhdCanMutateOnboarding],
    ['offboarding', MHD_OFFBOARDING_MUTATING_ROLES, mhdCanMutateOffboarding],
  ] as const)('%s matches what the server accepts', (_name, roles, canMutate) => {
    expect([...roles].sort()).toEqual([...SERVER_ACCEPTED].sort());
    for (const role of SERVER_ACCEPTED) expect(canMutate([role])).toBe(true);
    for (const role of [
      'Executive Leadership',
      'Director',
      'Manager',
      'Employee',
      'Viewer',
    ] as const) {
      expect(canMutate([role])).toBe(false);
    }
  });
});
