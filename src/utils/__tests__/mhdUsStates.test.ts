import { describe, expect, it } from 'vitest';
import { MHD_US_STATES, mhdStateCodeFromLocation } from '../mhdUsStates';

describe('MHD_US_STATES', () => {
  it('lists the fifty states and the District of Columbia once each', () => {
    expect(MHD_US_STATES).toHaveLength(51);
    expect(new Set(MHD_US_STATES.map((state) => state.code)).size).toBe(51);
    expect(MHD_US_STATES.every((state) => /^[A-Z]{2}$/.test(state.code))).toBe(true);
  });
});

describe('mhdStateCodeFromLocation', () => {
  it('reads the trailing state code of a city-and-state location', () => {
    expect(mhdStateCodeFromLocation('Los Angeles, CA')).toBe('CA');
    expect(mhdStateCodeFromLocation('Portland,OR')).toBe('OR');
  });

  it('returns null rather than guessing', () => {
    expect(mhdStateCodeFromLocation(null)).toBeNull();
    expect(mhdStateCodeFromLocation('Remote')).toBeNull();
    expect(mhdStateCodeFromLocation('Springfield, ZZ')).toBeNull();
  });
});
