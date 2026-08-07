import { describe, expect, it } from 'vitest';
import { MHD_SANDBOX_COMPANY_PREFIX } from '../Types';

describe('MHD_SANDBOX_COMPANY_PREFIX', () => {
  it('is the bracketed [Sandbox] marker every sandbox company name starts with', () => {
    expect(MHD_SANDBOX_COMPANY_PREFIX).toBe('[Sandbox]');
  });

  it('is safe to use as a prefix on a generated company name', () => {
    const sampleName = `${MHD_SANDBOX_COMPANY_PREFIX} 2026-08-06T12:00:00`;
    expect(sampleName.startsWith(MHD_SANDBOX_COMPANY_PREFIX)).toBe(true);
  });
});
