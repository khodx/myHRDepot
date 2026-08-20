import { describe, expect, it } from 'vitest';
import { mhdAnnouncementFormSchema } from '../Schemas';

describe('announcement form schema', () => {
  it('accepts a valid company-wide, publish-now, no-expiration draft', () => {
    const parsed = mhdAnnouncementFormSchema.safeParse({
      title: 'Office closed Friday',
      bodyPlainText: 'The office will be closed this Friday for the holiday.',
      audienceScope: 'company',
      audienceRoles: null,
      publishMode: 'now',
      scheduledPublishAt: null,
      expirationMode: 'none',
      expiresAt: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a role-scoped audience with no roles selected', () => {
    const parsed = mhdAnnouncementFormSchema.safeParse({
      title: 'Admins only',
      bodyPlainText: 'Body text.',
      audienceScope: 'roles',
      audienceRoles: [],
      publishMode: 'now',
      scheduledPublishAt: null,
      expirationMode: 'none',
      expiresAt: null,
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a scheduled publish with no date/time chosen', () => {
    const parsed = mhdAnnouncementFormSchema.safeParse({
      title: 'Scheduled',
      bodyPlainText: 'Body text.',
      audienceScope: 'company',
      audienceRoles: null,
      publishMode: 'scheduled',
      scheduledPublishAt: null,
      expirationMode: 'none',
      expiresAt: null,
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an expiration-on-date with no date chosen', () => {
    const parsed = mhdAnnouncementFormSchema.safeParse({
      title: 'Expiring',
      bodyPlainText: 'Body text.',
      audienceScope: 'company',
      audienceRoles: null,
      publishMode: 'now',
      scheduledPublishAt: null,
      expirationMode: 'onDate',
      expiresAt: null,
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects a blank title', () => {
    const parsed = mhdAnnouncementFormSchema.safeParse({
      title: '   ',
      bodyPlainText: 'Body text.',
      audienceScope: 'company',
      audienceRoles: null,
      publishMode: 'now',
      scheduledPublishAt: null,
      expirationMode: 'none',
      expiresAt: null,
    });
    expect(parsed.success).toBe(false);
  });
});
