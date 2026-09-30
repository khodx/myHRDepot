import { describe, expect, it } from 'vitest';
import {
  mhdValidateLeaveBenefitObligationStatus,
  mhdValidateLeaveSegmentStatus,
} from '../WorkflowValidation';

describe('leave status validation', () => {
  it('accepts only the segment lifecycle transitions and TAKEN hours', () => {
    expect(() => mhdValidateLeaveSegmentStatus({
      segmentId: 'seg-1', currentStatus: 'REQUESTED', status: 'APPROVED',
    })).not.toThrow();
    expect(() => mhdValidateLeaveSegmentStatus({
      segmentId: 'seg-1', currentStatus: 'REQUESTED', status: 'DENIED', actualHours: 2,
    })).toThrow('Actual hours may only be supplied');
    expect(() => mhdValidateLeaveSegmentStatus({
      segmentId: 'seg-1', currentStatus: 'APPROVED', status: 'TAKEN', currentActualHours: null,
    })).toThrow('requires actual hours greater than zero');
    expect(() => mhdValidateLeaveSegmentStatus({
      segmentId: 'seg-1', currentStatus: 'TAKEN', status: 'APPROVED',
    })).toThrow('cannot change');
  });

  it('requires a reason only when waiving an obligation', () => {
    expect(() => mhdValidateLeaveBenefitObligationStatus({
      obligationId: 'obl-1', currentStatus: 'ACTIVE', status: 'PAST_DUE', reason: '  ',
    })).not.toThrow();
    expect(() => mhdValidateLeaveBenefitObligationStatus({
      obligationId: 'obl-1', currentStatus: 'ACTIVE', status: 'WAIVED', reason: '  ',
    })).toThrow('requires a reason');
    expect(() => mhdValidateLeaveBenefitObligationStatus({
      obligationId: 'obl-1', currentStatus: 'WAIVED', status: 'ACTIVE',
    })).toThrow('cannot change');
  });
});
