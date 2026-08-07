import { describe, expect, it } from 'vitest';
import {
  MHD_EMPLOYEE_FILE_TYPE_KEYS,
  MHD_EMPLOYEE_FILE_TYPES,
  mhdEmployeeFileLabelForKey,
  mhdIsEmployeeFileTypeKey,
} from '../Types';

describe('MHD_EMPLOYEE_FILE_TYPES', () => {
  it('defines exactly the nine documented employee file categories', () => {
    expect(MHD_EMPLOYEE_FILE_TYPES).toHaveLength(9);
    expect(MHD_EMPLOYEE_FILE_TYPE_KEYS).toEqual([
      'general',
      'payroll',
      'i9',
      'medical',
      'benefits',
      'confidential',
      'supervisors',
      'hr',
      'private',
    ]);
  });

  it('marks every category except general as restricted', () => {
    const restrictedKeys = MHD_EMPLOYEE_FILE_TYPES.filter((type) => type.restricted).map(
      (type) => type.key,
    );
    expect(restrictedKeys).toEqual([
      'payroll',
      'i9',
      'medical',
      'benefits',
      'confidential',
      'supervisors',
      'hr',
      'private',
    ]);
    expect(MHD_EMPLOYEE_FILE_TYPES.find((type) => type.key === 'general')?.restricted).toBe(
      false,
    );
  });

  it('gives every category a distinct attachment entity type', () => {
    const entityTypes = MHD_EMPLOYEE_FILE_TYPES.map((type) => type.entityType);
    expect(new Set(entityTypes).size).toBe(entityTypes.length);
  });
});

describe('mhdIsEmployeeFileTypeKey', () => {
  it('accepts every documented key', () => {
    for (const key of MHD_EMPLOYEE_FILE_TYPE_KEYS) {
      expect(mhdIsEmployeeFileTypeKey(key)).toBe(true);
    }
  });

  it('rejects unknown, null, and undefined values', () => {
    expect(mhdIsEmployeeFileTypeKey('not-a-real-category')).toBe(false);
    expect(mhdIsEmployeeFileTypeKey(null)).toBe(false);
    expect(mhdIsEmployeeFileTypeKey(undefined)).toBe(false);
  });
});

describe('mhdEmployeeFileLabelForKey', () => {
  it('returns the documented label for a known key', () => {
    expect(mhdEmployeeFileLabelForKey('i9')).toBe('I9 File');
    expect(mhdEmployeeFileLabelForKey('supervisors')).toBe("Supervisor's File");
  });

  it('falls back to a generic label for null/undefined', () => {
    expect(mhdEmployeeFileLabelForKey(null)).toBe('Employee File');
    expect(mhdEmployeeFileLabelForKey(undefined)).toBe('Employee File');
  });
});
