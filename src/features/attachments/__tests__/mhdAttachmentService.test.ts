import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdAttachmentService } from '../Service';

// vi.hoisted: the vi.mock factories are hoisted above these declarations.
const { mockRpc, mockReturns, mockInvoke } = vi.hoisted(() => {
  const mockReturns = vi.fn();
  // list/create calls chain `.returns<Row[]>()`; delete is awaited directly and uses
  // `mockRpc.mockReturnValueOnce(Promise.resolve(...))` per test.
  const mockRpc = vi.fn((..._args: unknown[]): unknown => ({ returns: mockReturns }));
  const mockInvoke = vi.fn();
  return { mockRpc, mockReturns, mockInvoke };
});

vi.mock('@/config/appConfig', () => ({
  appConfig: {
    attachmentUploadFunctionName: 'mhd-drive-upload',
  },
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

describe('mhdAttachmentService', () => {
  beforeEach(() => {
    mockRpc.mockClear();
    mockReturns.mockReset();
    mockInvoke.mockReset();
  });

  it('lists attachments through the polymorphic RPC and maps snake_case rows to camelCase', async () => {
    // Row shape matches the live mhd_list_attachments_for_entity return (Google Drive
    // metadata columns; adapted from the package test which used camelCase rows).
    mockReturns.mockResolvedValueOnce({
      data: [
        {
          id: 'att-001',
          reference_id: 'FILE-000001',
          entity_type: 'TASK',
          entity_id: 'task-1',
          storage_provider: 'GOOGLE_DRIVE',
          drive_file_id: 'drive-file-1',
          drive_folder_id: 'drive-folder-1',
          drive_web_view_link: 'https://drive.google.com/file/d/drive-file-1/view',
          drive_web_content_link: 'https://drive.google.com/uc?id=drive-file-1',
          original_file_name: 'report.pdf',
          stored_file_name: null,
          mime_type: 'application/pdf',
          file_extension: '.pdf',
          file_size_bytes: 102400,
          version_number: 1,
          is_current_version: true,
          uploaded_by: 'user-1',
          uploaded_at: '2026-07-01T10:00:00Z',
          created_at: '2026-07-01T10:00:00Z',
          uploader_display_name: 'Jane Doe',
          can_delete: true,
        },
      ],
      error: null,
    });

    const result = await mhdAttachmentService.listAttachments('TASK', 'task-1');

    expect(mockRpc).toHaveBeenCalledWith('mhd_list_attachments_for_entity', {
      p_entity_type: 'TASK',
      p_entity_id: 'task-1',
    });
    expect(result).toHaveLength(1);
    expect(result[0].referenceId).toBe('FILE-000001');
    expect(result[0].originalFileName).toBe('report.pdf');
    expect(result[0].driveWebViewLink).toBe('https://drive.google.com/file/d/drive-file-1/view');
    expect(result[0].canDelete).toBe(true);
  });

  it('uploads through the Drive edge function, then persists metadata', async () => {
    const file = new File(['hello'], 'offer-letter.pdf', { type: 'application/pdf' });

    mockInvoke.mockResolvedValueOnce({
      data: {
        driveFileId: 'drive-file-123',
        driveFolderId: 'drive-folder-456',
        driveWebViewLink: 'https://drive.google.com/file/d/drive-file-123/view',
        driveWebContentLink: 'https://drive.google.com/uc?id=drive-file-123',
        storedFileName: 'offer-letter.pdf',
      },
      error: null,
    });

    mockReturns.mockResolvedValueOnce({
      data: [
        {
          id: 'att-001',
          reference_id: 'FILE-000001',
          drive_file_id: 'drive-file-123',
          drive_web_view_link: 'https://drive.google.com/file/d/drive-file-123/view',
        },
      ],
      error: null,
    });

    const result = await mhdAttachmentService.uploadAttachment('TASK', 'task-1', file);

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke.mock.calls[0][0]).toBe('mhd-drive-upload');
    expect(mockRpc).toHaveBeenCalledWith(
      'mhd_create_attachment',
      expect.objectContaining({
        p_entity_type: 'TASK',
        p_entity_id: 'task-1',
        p_drive_file_id: 'drive-file-123',
        p_drive_folder_id: 'drive-folder-456',
        p_original_file_name: 'offer-letter.pdf',
      }),
    );
    expect(result.referenceId).toBe('FILE-000001');
  });

  it('omits optional metadata args rather than passing null', async () => {
    // No file extension and no Drive stored_file_name -> p_file_extension /
    // p_stored_file_name / p_version_number must be absent from the RPC payload.
    const file = new File(['hello'], 'READM', { type: 'text/plain' });

    mockInvoke.mockResolvedValueOnce({
      data: {
        driveFileId: 'drive-file-123',
        driveFolderId: 'drive-folder-456',
        driveWebViewLink: null,
        driveWebContentLink: null,
      },
      error: null,
    });
    mockReturns.mockResolvedValueOnce({
      data: [{ id: 'att-002', reference_id: 'FILE-000002', drive_file_id: 'drive-file-123', drive_web_view_link: null }],
      error: null,
    });

    await mhdAttachmentService.uploadAttachment('TASK', 'task-1', file);

    const createArgs = mockRpc.mock.calls.find((call) => call[0] === 'mhd_create_attachment')?.[1] as Record<
      string,
      unknown
    >;
    expect(createArgs).toBeDefined();
    expect('p_file_extension' in createArgs).toBe(false);
    expect('p_stored_file_name' in createArgs).toBe(false);
    expect('p_version_number' in createArgs).toBe(false);
  });

  it('throws when the Drive edge function fails', async () => {
    const file = new File(['hello'], 'offer-letter.pdf', { type: 'application/pdf' });

    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: 'Drive credentials missing' },
    });

    await expect(mhdAttachmentService.uploadAttachment('TASK', 'task-1', file)).rejects.toThrow(
      'Drive credentials missing',
    );
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
