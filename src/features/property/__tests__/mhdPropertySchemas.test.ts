import { describe, expect, it } from 'vitest';
import {
  mhdCreatePropertyItemSchema,
  mhdIssuePropertySchema,
  mhdReturnPropertySchema,
  mhdUpdatePropertyItemSchema,
} from '../Schemas';

describe('mhdCreatePropertyItemSchema', () => {
  it('accepts a valid item', () => {
    const result = mhdCreatePropertyItemSchema.safeParse({
      companyId: 'company-abc',
      category: 'ELECTRONICS',
      name: 'MacBook Pro 14"',
      quantityTotal: 3,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = mhdCreatePropertyItemSchema.safeParse({
      companyId: 'company-abc',
      category: 'ELECTRONICS',
      name: '',
      quantityTotal: 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a non-positive quantity', () => {
    const result = mhdCreatePropertyItemSchema.safeParse({
      companyId: 'company-abc',
      category: 'EQUIPMENT',
      name: 'Drill',
      quantityTotal: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative unit cost', () => {
    const result = mhdCreatePropertyItemSchema.safeParse({
      companyId: 'company-abc',
      category: 'EQUIPMENT',
      name: 'Drill',
      quantityTotal: 1,
      unitCost: -10,
    });
    expect(result.success).toBe(false);
  });
});

describe('mhdUpdatePropertyItemSchema', () => {
  it('accepts a valid edit payload', () => {
    const result = mhdUpdatePropertyItemSchema.safeParse({
      name: 'MacBook Pro 14"',
      description: 'Reissued fleet laptop',
      status: 'ASSIGNED',
      conditionNotes: 'Minor wear on lid',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a blank name', () => {
    const result = mhdUpdatePropertyItemSchema.safeParse({
      name: '',
      status: 'IN_STOCK',
    });
    expect(result.success).toBe(false);
  });
});

describe('mhdIssuePropertySchema', () => {
  const validInput = {
    propertyItemId: 'item-1',
    personId: 'person-1',
    quantity: 1,
    employeeAckReceipt: true as const,
    employeeAckMaintain: true as const,
    employeeAckReportLoss: true as const,
    employeeAckPolicy: true as const,
    employeeSignatureName: 'Jane Doe',
  };

  it('accepts a fully acknowledged issuance', () => {
    const result = mhdIssuePropertySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects when any acknowledgment is false', () => {
    const result = mhdIssuePropertySchema.safeParse({
      ...validInput,
      employeeAckPolicy: false,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a missing signature', () => {
    const result = mhdIssuePropertySchema.safeParse({
      ...validInput,
      employeeSignatureName: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('mhdReturnPropertySchema', () => {
  const validInput = {
    returnAckReturned: true as const,
    returnAckMaintained: true as const,
    returnAckLiability: true as const,
    employeeReturnSignatureName: 'Jane Doe',
  };

  it('accepts a fully acknowledged return', () => {
    const result = mhdReturnPropertySchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects when any acknowledgment is false', () => {
    const result = mhdReturnPropertySchema.safeParse({ ...validInput, returnAckLiability: false });
    expect(result.success).toBe(false);
  });
});
