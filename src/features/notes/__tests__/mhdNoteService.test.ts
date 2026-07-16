import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdCreateNote, mhdListNotesForEntity, mhdUpdateNote } from '../Service';
import { mhdPlainTextToRichText } from '../Types';

// vi.hoisted: the vi.mock factory is hoisted above these declarations.
const { rpcMock, returnsMock } = vi.hoisted(() => {
  const returnsMock = vi.fn();
  // List/search calls chain `.returns<Row[]>()`; mutation calls are awaited directly and
  // use `rpcMock.mockReturnValueOnce(Promise.resolve(...))` per test.
  const rpcMock = vi.fn((..._args: unknown[]): unknown => ({ returns: returnsMock }));
  return { rpcMock, returnsMock };
});

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

describe('mhdNoteService', () => {
  beforeEach(() => {
    rpcMock.mockClear();
    returnsMock.mockReset();
  });

  it('calls list notes RPC with entity arguments and maps rows to camelCase', async () => {
    returnsMock.mockResolvedValueOnce({
      data: [{
        id: 'NOTE01', reference_id: 'NOTE-000001', company_id: 'COMP01', entity_type: 'TASK', entity_id: 'TASK01',
        note_rich_text: null, note_plain_text: 'New note', visibility: 'PUBLIC',
        created_at: '2026-01-01T00:00:00Z', created_by: 'USER01', created_by_display_name: 'Jane Doe',
        updated_at: '2026-01-01T00:00:00Z', updated_by: 'USER01', can_edit: true, can_delete: true,
      }],
      error: null,
    });
    const notes = await mhdListNotesForEntity('TASK', 'TASK01');
    expect(rpcMock).toHaveBeenCalledWith('mhd_list_notes_for_entity', { p_entity_type: 'TASK', p_entity_id: 'TASK01' });
    expect(notes[0].referenceId).toBe('NOTE-000001');
    expect(notes[0].createdByDisplayName).toBe('Jane Doe');
  });

  it('calls create note RPC with validated payload', async () => {
    // mhd_create_note resolves directly (no .returns() chain in the service).
    const richText = mhdPlainTextToRichText('New note');
    rpcMock.mockReturnValueOnce(Promise.resolve({ data: [{ id: 'NOTE01', reference_id: 'NOTE-000001' }], error: null }));
    const result = await mhdCreateNote({ entityType: 'TASK', entityId: 'TASK01', noteRichText: richText, notePlainText: 'New note', visibility: 'PUBLIC' });
    expect(result.referenceId).toBe('NOTE-000001');
    expect(rpcMock).toHaveBeenCalledWith('mhd_create_note', {
      p_entity_type: 'TASK',
      p_entity_id: 'TASK01',
      p_note_rich_text: richText,
      p_note_plain_text: 'New note',
      p_visibility: 'PUBLIC',
    });
  });

  it('omits p_visibility (rather than passing null) when updating without a visibility change', async () => {
    const richText = mhdPlainTextToRichText('Edited note');
    rpcMock.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));
    await mhdUpdateNote({ noteId: 'NOTE01', noteRichText: richText, notePlainText: 'Edited note' });
    expect(rpcMock).toHaveBeenCalledWith('mhd_update_note', {
      p_note_id: 'NOTE01',
      p_note_rich_text: richText,
      p_note_plain_text: 'Edited note',
    });
  });
});
