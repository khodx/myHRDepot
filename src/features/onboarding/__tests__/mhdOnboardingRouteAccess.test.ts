import { describe, expect, it } from 'vitest';
import {
  MHD_ROUTE_ACCESS,
  mhdCanAccessRoute,
  mhdIsRouteComingSoon,
  mhdRouteStatus,
} from '@/appshell/mhdRouteAccess';
import { MHD_ONBOARDING_PACKET_DEFINITIONS } from '../Types';

/**
 * /onboarding access rules.
 *
 * The onboarding module previously had no top-level route at all — the packet
 * checklist rendered only as a card inside /people/:personId, which made the
 * module unreachable from the navigation. These tests pin the route down so it
 * cannot silently disappear again, and pin its audience so the packet's
 * RESTRICTED-tier documents (I-9, W-4, direct deposit banking, consumer report
 * disclosures) are never widened to Client User or Viewer by accident.
 *
 * The role list here must stay in step with the role check inside
 * mhd_list_onboarding_progress_for_company (migration 0055); widening one
 * without the other produces either a blank roster or an access leak.
 */
describe('onboarding route access', () => {
  it('registers a top-level /onboarding rule', () => {
    expect(MHD_ROUTE_ACCESS.some((rule) => rule.path === '/onboarding')).toBe(true);
  });

  it('admits the privileged trio', () => {
    expect(mhdCanAccessRoute('/onboarding', ['Platform Admin'])).toBe(true);
    expect(mhdCanAccessRoute('/onboarding', ['HR Partner'])).toBe(true);
    expect(mhdCanAccessRoute('/onboarding', ['Client Admin'])).toBe(true);
  });

  it('excludes Client User and Viewer from the packet roster', () => {
    expect(mhdCanAccessRoute('/onboarding', ['Employee'])).toBe(false);
    expect(mhdCanAccessRoute('/onboarding', ['Viewer'])).toBe(false);
  });

  it('lets /onboarding/:personId inherit the rule via prefix match', () => {
    expect(mhdCanAccessRoute('/onboarding/abc-123', ['HR Partner'])).toBe(true);
    expect(mhdCanAccessRoute('/onboarding/abc-123', ['Viewer'])).toBe(false);
  });

  it('treats /onboarding as live for every role that can reach it', () => {
    expect(mhdRouteStatus('/onboarding')).toBe('live');
    for (const role of ['HR Partner', 'Client Admin', 'Platform Admin'] as const) {
      expect(mhdIsRouteComingSoon('/onboarding', [role])).toBe(false);
      expect(mhdIsRouteComingSoon('/onboarding/abc-123', [role])).toBe(false);
    }
  });

  it('keeps live routes live regardless of role', () => {
    for (const path of ['/tasks', '/dashboard'] as const) {
      expect(mhdRouteStatus(path)).toBe('live');
      expect(mhdIsRouteComingSoon(path, ['Client Admin'])).toBe(false);
      expect(mhdIsRouteComingSoon(path, ['Platform Admin'])).toBe(false);
    }
  });

  it('does not let /onboarding capture /offboarding', () => {
    // Both rules exist and both are privileged, so a prefix collision would not
    // change behaviour today — assert they resolve independently anyway, since
    // the two audiences are free to diverge later.
    expect(MHD_ROUTE_ACCESS.some((rule) => rule.path === '/offboarding')).toBe(true);
    expect(mhdCanAccessRoute('/offboarding', ['Client Admin'])).toBe(true);
  });

  it('treats /offboarding as live for every role that can reach it', () => {
    expect(mhdRouteStatus('/offboarding')).toBe('live');
    for (const role of ['HR Partner', 'Client Admin', 'Platform Admin'] as const) {
      expect(mhdIsRouteComingSoon('/offboarding', [role])).toBe(false);
    }
  });
});

describe('onboarding packet manifest', () => {
  it('carries the full twenty-four document packet', () => {
    expect(MHD_ONBOARDING_PACKET_DEFINITIONS).toHaveLength(24);
  });

  it('has a unique document key per item', () => {
    const keys = MHD_ONBOARDING_PACKET_DEFINITIONS.map((packet) => packet.documentKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('names a distinct seeded form for every item', () => {
    // The roster and the checklist both join forms by name, so a duplicate or
    // missing formName silently maps two packet items onto one form.
    const names = MHD_ONBOARDING_PACKET_DEFINITIONS.map((packet) => packet.formName);
    expect(new Set(names).size).toBe(names.length);
    expect(names.every((name) => name.startsWith('New Hire - '))).toBe(true);
  });
});
