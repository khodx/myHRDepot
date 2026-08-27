import { describe, expect, it } from 'vitest';
import { mhdPersonDisplayName, mhdPersonFormSchema } from '../Schemas';

describe('mhdPersonFormSchema', () => {
  it('accepts a valid person payload', () => {
    const parsed = mhdPersonFormSchema.parse({
      companyId: '01ABC',
      firstName: 'Maria',
      middleName: '',
      lastName: 'Lopez',
      preferredName: '',
      email: 'maria@example.com',
      phone: '9515551000',
      mobile: '',
    });

    expect(parsed.firstName).toBe('Maria');
    expect(parsed.email).toBe('maria@example.com');
  });

  it('rejects a blank last name', () => {
    expect(() =>
      mhdPersonFormSchema.parse({
        companyId: '01ABC',
        firstName: 'Maria',
        lastName: '',
        email: '',
      }),
    ).toThrow();
  });

  it('uses preferred name alone as the display name when supplied', () => {
    expect(
      mhdPersonDisplayName({ firstName: 'Marcel', lastName: 'Furnace', preferredName: 'Mac' }),
    ).toBe('Mac');
  });

  it('falls back to first and last name when no preferred name is set', () => {
    expect(
      mhdPersonDisplayName({ firstName: 'Marcel', lastName: 'Furnace', preferredName: '' }),
    ).toBe('Marcel Furnace');
  });
});
