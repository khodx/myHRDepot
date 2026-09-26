import { beforeEach, describe, expect, it, vi } from 'vitest';

const { invokeMock, rpcMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    functions: { invoke: invokeMock },
    rpc: rpcMock,
  },
}));

const { mhdTrainingService } = await import('../Service');

describe('mhdTrainingService.uploadVideo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('invokes the edge function, PUTs raw bytes to R2, then records the asset', async () => {
    const file = new File(['video'], 'lesson.mp4', { type: 'video/mp4' });
    invokeMock.mockResolvedValueOnce({
      data: {
        uploadUrl: 'https://r2.example/upload?signature=abc',
        objectKey: 'training/block-1/lesson.mp4',
        publicUrl: 'https://cdn.example/lesson.mp4',
        expiresInSeconds: 300,
      },
      error: null,
    });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));
    rpcMock.mockResolvedValueOnce({ data: [{ id: 'asset-1' }], error: null });

    await expect(mhdTrainingService.uploadVideo({ blockId: 'block-1', file })).resolves.toEqual({
      id: 'asset-1',
      objectKey: 'training/block-1/lesson.mp4',
      publicUrl: 'https://cdn.example/lesson.mp4',
    });
    expect(invokeMock).toHaveBeenCalledWith('mhd-video-upload', {
      body: {
        block_id: 'block-1',
        original_file_name: 'lesson.mp4',
        mime_type: 'video/mp4',
        file_size_bytes: file.size,
      },
    });
    expect(fetch).toHaveBeenCalledWith('https://r2.example/upload?signature=abc', {
      method: 'PUT',
      body: file,
    });
    expect(rpcMock).toHaveBeenCalledWith('mhd_training_video_asset_record', {
      p_block_id: 'block-1',
      p_object_key: 'training/block-1/lesson.mp4',
      p_original_file_name: 'lesson.mp4',
      p_mime_type: 'video/mp4',
      p_file_size_bytes: file.size,
      p_public_url: 'https://cdn.example/lesson.mp4',
    });
  });

  it('rejects unsupported MIME types before invoking the edge function', async () => {
    const file = new File(['audio'], 'lesson.mp3', { type: 'audio/mpeg' });
    await expect(mhdTrainingService.uploadVideo({ blockId: 'block-1', file })).rejects.toThrow(
      'Unsupported video type',
    );
    expect(invokeMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('rejects files over the 5GB client-side limit before invoking the edge function', async () => {
    const file = {
      name: 'lesson.mp4',
      type: 'video/mp4',
      size: 5 * 1024 * 1024 * 1024 + 1,
    } as File;

    await expect(mhdTrainingService.uploadVideo({ blockId: 'block-1', file })).rejects.toThrow(
      '5GB or smaller',
    );
    expect(invokeMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it('surfaces a failed direct PUT and does not persist metadata', async () => {
    const file = new File(['video'], 'lesson.webm', { type: 'video/webm' });
    invokeMock.mockResolvedValueOnce({
      data: {
        uploadUrl: 'https://r2.example/upload',
        objectKey: 'training/block-1/lesson.webm',
        publicUrl: 'https://cdn.example/lesson.webm',
        expiresInSeconds: 300,
      },
      error: null,
    });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 503 }));

    await expect(mhdTrainingService.uploadVideo({ blockId: 'block-1', file })).rejects.toThrow(
      'HTTP 503',
    );
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
