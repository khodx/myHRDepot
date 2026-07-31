import { describe, it, expect } from 'vitest';
import { mhdAttachmentUploadSchema } from '../Schemas';
import { MHD_ATTACHMENT_MAX_SIZE_BYTES } from '../Types';

function makeFile(name: string, type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], name, { type });
}

const validDescription = {
  descriptionRichText: { type: 'mhd_rich_text', version: 1, html: '<p>Notes</p>', plainText: 'Notes' },
  descriptionPlainText: 'Notes',
};

describe('mhdAttachmentUploadSchema', () => {
  describe('file validation', () => {
    it('accepts a valid PDF under 25 MB', () => {
      const result = mhdAttachmentUploadSchema.safeParse({
        file: makeFile('report.pdf', 'application/pdf', 1_000_000),
        entityType: 'TASK',
        entityId: 'task-123',
        ...validDescription,
      });
      expect(result.success).toBe(true);
    });

    it('rejects a file over 25 MB', () => {
      const result = mhdAttachmentUploadSchema.safeParse({
        file: makeFile('huge.pdf', 'application/pdf', MHD_ATTACHMENT_MAX_SIZE_BYTES + 1),
        entityType: 'TASK',
        entityId: 'task-123',
        ...validDescription,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('25 MB');
    });

    it('rejects a disallowed MIME type', () => {
      const result = mhdAttachmentUploadSchema.safeParse({
        file: makeFile('script.exe', 'application/x-msdownload', 100),
        entityType: 'TASK',
        entityId: 'task-123',
        ...validDescription,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toContain('not allowed');
    });

    it('accepts an Excel file', () => {
      const result = mhdAttachmentUploadSchema.safeParse({
        file: makeFile(
          'data.xlsx',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          5_000,
        ),
        entityType: 'TASK',
        entityId: 'task-123',
        ...validDescription,
      });
      expect(result.success).toBe(true);
    });

    it('accepts a PNG image', () => {
      const result = mhdAttachmentUploadSchema.safeParse({
        file: makeFile('screenshot.png', 'image/png', 200_000),
        entityType: 'TASK',
        entityId: 'task-123',
        ...validDescription,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('entity fields', () => {
    it('accepts SUBTASK and NOTE entity types', () => {
      for (const entityType of ['SUBTASK', 'NOTE'] as const) {
        const result = mhdAttachmentUploadSchema.safeParse({
          file: makeFile('file.pdf', 'application/pdf', 100),
          entityType,
          entityId: 'entity-123',
          ...validDescription,
        });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid entityType', () => {
      const result = mhdAttachmentUploadSchema.safeParse({
        file: makeFile('file.pdf', 'application/pdf', 100),
        entityType: 'INVOICE',
        entityId: 'task-123',
        ...validDescription,
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty entityId', () => {
      const result = mhdAttachmentUploadSchema.safeParse({
        file: makeFile('file.pdf', 'application/pdf', 100),
        entityType: 'TASK',
        entityId: '',
        ...validDescription,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('description', () => {
    it('rejects a missing descriptionRichText', () => {
      const result = mhdAttachmentUploadSchema.safeParse({
        file: makeFile('file.pdf', 'application/pdf', 100),
        entityType: 'TASK',
        entityId: 'task-123',
        descriptionRichText: null,
        descriptionPlainText: 'Notes',
      });
      expect(result.success).toBe(false);
    });

    it('rejects a blank descriptionPlainText', () => {
      const result = mhdAttachmentUploadSchema.safeParse({
        file: makeFile('file.pdf', 'application/pdf', 100),
        entityType: 'TASK',
        entityId: 'task-123',
        descriptionRichText: validDescription.descriptionRichText,
        descriptionPlainText: '   ',
      });
      expect(result.success).toBe(false);
    });
  });
});
