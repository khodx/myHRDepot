import { describe, expect, it } from 'vitest';
import { mhdCreateNoteSchema, mhdUpdateNoteSchema } from '../Schemas';
import { mhdPlainTextToRichText } from '../Types';

// Adapted from the package tests: the schemas require the rich-text companion
// (noteRichText) alongside the plain text, so the payloads here derive it via
// mhdPlainTextToRichText — the original package tests omitted it.
describe('mhd note schemas', () => {
  it('accepts a valid create note payload', () => {
    const parsed = mhdCreateNoteSchema.parse({
      entityType: 'TASK',
      entityId: '01ABC',
      noteRichText: mhdPlainTextToRichText('Follow up with client.'),
      notePlainText: 'Follow up with client.',
      visibility: 'PUBLIC',
    });
    expect(parsed.notePlainText).toBe('Follow up with client.');
  });

  it('defaults visibility to PUBLIC when omitted', () => {
    const parsed = mhdCreateNoteSchema.parse({
      entityType: 'TASK',
      entityId: '01ABC',
      noteRichText: mhdPlainTextToRichText('Follow up.'),
      notePlainText: 'Follow up.',
    });
    expect(parsed.visibility).toBe('PUBLIC');
  });

  it('rejects blank note text', () => {
    expect(() =>
      mhdCreateNoteSchema.parse({
        entityType: 'TASK',
        entityId: '01ABC',
        noteRichText: mhdPlainTextToRichText(' '),
        notePlainText: '   ',
        visibility: 'PUBLIC',
      }),
    ).toThrow();
  });

  it('rejects a missing rich text document', () => {
    expect(() =>
      mhdCreateNoteSchema.parse({
        entityType: 'TASK',
        entityId: '01ABC',
        noteRichText: null,
        notePlainText: 'Follow up with client.',
        visibility: 'PUBLIC',
      }),
    ).toThrow();
  });

  it('accepts a valid update note payload', () => {
    const parsed = mhdUpdateNoteSchema.parse({
      noteId: '01NOTE',
      noteRichText: mhdPlainTextToRichText('Updated note.'),
      notePlainText: 'Updated note.',
      visibility: 'PRIVATE',
    });
    expect(parsed.visibility).toBe('PRIVATE');
  });

  it('accepts ACTIVITY as a valid note entity type', () => {
    const parsed = mhdCreateNoteSchema.parse({
      entityType: 'ACTIVITY',
      entityId: 'ACTV01',
      noteRichText: mhdPlainTextToRichText('Activity note'),
      notePlainText: 'Activity note',
      visibility: 'ADMIN',
    });

    expect(parsed.entityType).toBe('ACTIVITY');
  });
});
