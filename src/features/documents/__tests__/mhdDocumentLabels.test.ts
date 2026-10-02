import { describe, expect, it } from 'vitest';
import {
  MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES,
  MHD_DOCUMENT_QUEUE_STATUSES,
  MHD_DOCUMENT_QUEUE_STATUS_LABELS,
  MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORY_LABELS,
  MHD_DOCUMENT_SOURCE_WIZARDS,
  MHD_DOCUMENT_SOURCE_WIZARD_LABELS,
  mhdFormatDocumentEntityType,
} from '../Types';

describe('document display labels', () => {
  it('labels every wizard source, queue status and employee file category', () => {
    for (const wizard of MHD_DOCUMENT_SOURCE_WIZARDS) {
      expect(MHD_DOCUMENT_SOURCE_WIZARD_LABELS[wizard]).toMatch(/\S/);
    }
    for (const status of MHD_DOCUMENT_QUEUE_STATUSES) {
      expect(MHD_DOCUMENT_QUEUE_STATUS_LABELS[status]).toMatch(/\S/);
    }
    for (const category of MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES) {
      expect(MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORY_LABELS[category]).toMatch(/\S/);
    }
  });

  it('never offers medical as a document filing category', () => {
    expect(MHD_DOCUMENT_EMPLOYEE_FILE_CATEGORIES).not.toContain('medical');
  });

  it('formats an entity type for display', () => {
    expect(mhdFormatDocumentEntityType('CONDUCT_ACTION')).toBe('Conduct Action');
    expect(mhdFormatDocumentEntityType('SAFETY_INCIDENT')).toBe('Safety Incident');
    expect(mhdFormatDocumentEntityType('PERSON')).toBe('Person');
    expect(mhdFormatDocumentEntityType('')).toBe('');
  });
});
