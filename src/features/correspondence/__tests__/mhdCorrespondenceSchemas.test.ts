import { describe, expect, it } from 'vitest';
import {
  mhdLinkCorrespondenceThreadSchema,
  mhdNewCorrespondenceSchema,
  mhdReplyCorrespondenceSchema,
} from '../Schemas';

describe('mhdNewCorrespondenceSchema', () => {
  it('accepts a valid outbound correspondence message', () => {
    const result = mhdNewCorrespondenceSchema.safeParse({
      companyId: 'company-001',
      subject: 'Benefits question',
      recipientEmails: 'employee@example.com, hr@example.com',
      ccEmails: '',
      body: 'Can you review this?',
    });

    expect(result.success).toBe(true);
    expect(result.data?.recipientEmails).toEqual(['employee@example.com', 'hr@example.com']);
  });

  it('rejects a blank message body', () => {
    const result = mhdNewCorrespondenceSchema.safeParse({
      companyId: 'company-001',
      subject: 'Benefits question',
      recipientEmails: 'employee@example.com',
      body: ' ',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Message is required.');
  });

  it('rejects invalid recipient emails', () => {
    const result = mhdNewCorrespondenceSchema.safeParse({
      companyId: 'company-001',
      subject: 'Benefits question',
      recipientEmails: 'not-an-email',
      body: 'Hello',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Enter valid email addresses.');
  });
});

describe('mhdReplyCorrespondenceSchema', () => {
  it('accepts a valid reply', () => {
    const result = mhdReplyCorrespondenceSchema.safeParse({
      recipientEmails: 'employee@example.com',
      ccEmails: 'manager@example.com',
      body: 'Following up.',
      inReplyToMessageId: 'message-001',
    });

    expect(result.success).toBe(true);
    expect(result.data?.ccEmails).toEqual(['manager@example.com']);
  });
});

describe('mhdLinkCorrespondenceThreadSchema', () => {
  it('accepts supported target types', () => {
    const result = mhdLinkCorrespondenceThreadSchema.safeParse({
      entityType: 'LEAVE_CASE',
      entityId: 'case-001',
    });

    expect(result.success).toBe(true);
  });

  it('rejects unsupported target types', () => {
    const result = mhdLinkCorrespondenceThreadSchema.safeParse({
      entityType: 'TASK',
      entityId: 'task-001',
    });

    expect(result.success).toBe(false);
  });
});
