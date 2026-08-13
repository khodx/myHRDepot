import { describe, expect, it } from 'vitest';
import { mhdNextPreferredName } from '../MhdPersonIdentityFields';

describe('mhdNextPreferredName', () => {
  it('mirrors first name into preferred name while both are empty', () => {
    expect(mhdNextPreferredName('', '', 'J')).toBe('J');
  });

  it('keeps mirroring as first name is typed, one keystroke at a time', () => {
    let firstName = '';
    let preferredName = '';

    for (const nextFirstName of ['J', 'Ja', 'Jan', 'Jane']) {
      preferredName = mhdNextPreferredName(firstName, preferredName, nextFirstName);
      firstName = nextFirstName;
    }

    expect(preferredName).toBe('Jane');
  });

  it('stops mirroring once preferred name is edited directly', () => {
    // Preferred name has diverged from first name ("Jane" vs "JJ").
    expect(mhdNextPreferredName('Jane', 'JJ', 'Janet')).toBe('JJ');
  });

  it('leaves an already-different preferred name alone on load (e.g. Robert/Bob)', () => {
    expect(mhdNextPreferredName('Robert', 'Bob', 'Roberto')).toBe('Bob');
  });
});
