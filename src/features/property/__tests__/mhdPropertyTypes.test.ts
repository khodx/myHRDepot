import { describe, expect, it } from 'vitest';
import {
  mhdFormatPropertyAssignmentStatus,
  mhdFormatPropertyItemStatus,
  mhdIsPropertyIssuanceComplete,
  mhdIsPropertyReturnComplete,
} from '../Types';

describe('mhdIsPropertyIssuanceComplete', () => {
  it('is true when all acknowledgments and signature are present', () => {
    expect(
      mhdIsPropertyIssuanceComplete({
        employeeAckReceipt: true,
        employeeAckMaintain: true,
        employeeAckReportLoss: true,
        employeeAckPolicy: true,
        employeeSignatureName: 'Jane Doe',
      }),
    ).toBe(true);
  });

  it('is false when one acknowledgment is missing', () => {
    expect(
      mhdIsPropertyIssuanceComplete({
        employeeAckReceipt: true,
        employeeAckMaintain: true,
        employeeAckReportLoss: false,
        employeeAckPolicy: true,
        employeeSignatureName: 'Jane Doe',
      }),
    ).toBe(false);
  });

  it('is false when signature is blank', () => {
    expect(
      mhdIsPropertyIssuanceComplete({
        employeeAckReceipt: true,
        employeeAckMaintain: true,
        employeeAckReportLoss: true,
        employeeAckPolicy: true,
        employeeSignatureName: '   ',
      }),
    ).toBe(false);
  });
});

describe('mhdIsPropertyReturnComplete', () => {
  it('is true when all acknowledgments and signature are present', () => {
    expect(
      mhdIsPropertyReturnComplete({
        returnAckReturned: true,
        returnAckMaintained: true,
        returnAckLiability: true,
        employeeReturnSignatureName: 'Jane Doe',
      }),
    ).toBe(true);
  });

  it('is false when signature is missing', () => {
    expect(
      mhdIsPropertyReturnComplete({
        returnAckReturned: true,
        returnAckMaintained: true,
        returnAckLiability: true,
        employeeReturnSignatureName: null,
      }),
    ).toBe(false);
  });
});

describe('status formatters', () => {
  it('formats property item statuses', () => {
    expect(mhdFormatPropertyItemStatus('IN_STOCK')).toBe('In Stock');
    expect(mhdFormatPropertyItemStatus('DAMAGED')).toBe('Damaged');
  });

  it('formats assignment statuses', () => {
    expect(mhdFormatPropertyAssignmentStatus('ISSUED')).toBe('Issued');
    expect(mhdFormatPropertyAssignmentStatus('RETURNED')).toBe('Returned');
  });
});
