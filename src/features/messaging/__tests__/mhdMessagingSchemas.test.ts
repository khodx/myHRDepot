import { describe, expect, it } from 'vitest';
import { mhdCreateMessageThreadSchema, mhdSendMessageSchema } from '../Schemas';

const validCreateThreadInput = {
  companyId: 'company-001',
  threadType: 'DIRECT',
  subject: 'Benefits question',
  entityType: null,
  entityId: null,
  participantUserIds: ['user-002'],
  initialBody: 'Can you review this?',
};

describe('mhdCreateMessageThreadSchema', () => {
  it('should accept a valid direct thread', () => {
    const result = mhdCreateMessageThreadSchema.safeParse(validCreateThreadInput);

    expect(result.success).toBe(true);
  });

  it('should accept a valid module thread with entity details', () => {
    const result = mhdCreateMessageThreadSchema.safeParse({
      ...validCreateThreadInput,
      threadType: 'MODULE',
      entityType: 'TASK',
      entityId: 'task-001',
    });

    expect(result.success).toBe(true);
  });

  it('should reject a module thread without entity details', () => {
    const result = mhdCreateMessageThreadSchema.safeParse({
      ...validCreateThreadInput,
      threadType: 'MODULE',
      entityType: 'TASK',
      entityId: ' ',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Module threads require an entity type and entity id.',
          path: ['entityId'],
        }),
      ]),
    );
  });

  it('should reject missing participants', () => {
    const result = mhdCreateMessageThreadSchema.safeParse({
      ...validCreateThreadInput,
      participantUserIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('At least one participant is required.');
  });

  it('should reject blank initial body', () => {
    const result = mhdCreateMessageThreadSchema.safeParse({
      ...validCreateThreadInput,
      initialBody: ' ',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Message is required.');
  });

  it('should reject subjects over 200 characters', () => {
    const result = mhdCreateMessageThreadSchema.safeParse({
      ...validCreateThreadInput,
      subject: 'a'.repeat(201),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Subject must be 200 characters or fewer.');
  });
});

describe('mhdSendMessageSchema', () => {
  it('should accept a valid message body', () => {
    const result = mhdSendMessageSchema.safeParse({ body: 'Can you review this?' });

    expect(result.success).toBe(true);
  });

  it('should reject a blank message body', () => {
    const result = mhdSendMessageSchema.safeParse({ body: ' ' });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Message is required.');
  });

  it('should reject message bodies over 10000 characters', () => {
    const result = mhdSendMessageSchema.safeParse({ body: 'a'.repeat(10001) });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Message must be 10,000 characters or fewer.');
  });
});
