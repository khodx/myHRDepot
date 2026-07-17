import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdFormSubmission } from '../Types';
import { mhdIsEncryptedFormValue } from '../Types';

/**
 * Encrypted (field_encryption_required) submission values:
 * - service-level: the reveal RPC invocation and the masked-wrapper type guard
 * - component-level: masked display and the role-gated Reveal button in
 *   MhdFormSubmissionReview (Platform Admin / HR Partner / Client Admin only)
 */

const { mockRpc } = vi.hoisted(() => ({ mockRpc: vi.fn() }));

vi.mock('@/config/appConfig', () => ({
  appConfig: {
    attachmentUploadFunctionName: 'mhd-drive-upload',
  },
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: {
    rpc: mockRpc,
  },
}));

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

const { mhdFormService } = await import('../Service');
const { MhdFormSubmissionReview } = await import('../components/MhdFormSubmissionReview');

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    roles,
  });
}

const maskedSubmission: MhdFormSubmission = {
  id: 'submission-1',
  referenceId: 'FSUB-000001',
  formId: 'form-1',
  submitterId: 'user-1',
  taskId: null,
  status: 'SUBMITTED',
  values: {
    'field-bank': 'First National Test Bank',
    'field-routing': { mhd_encrypted: true, masked: true },
  },
  createdAt: '2026-07-16T00:00:00Z',
  updatedAt: '2026-07-16T00:00:00Z',
  submittedAt: '2026-07-16T00:00:00Z',
  isDraft: false,
};

describe('mhdIsEncryptedFormValue', () => {
  it('recognizes a masked wrapper', () => {
    expect(mhdIsEncryptedFormValue({ mhd_encrypted: true, masked: true })).toBe(true);
  });

  it('recognizes a cipher-bearing wrapper', () => {
    expect(mhdIsEncryptedFormValue({ mhd_encrypted: true, cipher: '-----BEGIN PGP MESSAGE-----' })).toBe(true);
  });

  it('rejects non-wrapper values', () => {
    expect(mhdIsEncryptedFormValue('021000021')).toBe(false);
    expect(mhdIsEncryptedFormValue(null)).toBe(false);
    expect(mhdIsEncryptedFormValue(undefined)).toBe(false);
    expect(mhdIsEncryptedFormValue(['mhd_encrypted'])).toBe(false);
    expect(mhdIsEncryptedFormValue({ mhd_encrypted: 'true' })).toBe(false);
    expect(mhdIsEncryptedFormValue({ driveFileId: 'abc', fileName: 'f.pdf' })).toBe(false);
  });
});

describe('mhdFormService.revealSubmissionField', () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it('invokes the mhd_reveal_submission_field RPC and returns the plaintext', async () => {
    mockRpc.mockResolvedValueOnce({ data: '021000021', error: null });

    const plaintext = await mhdFormService.revealSubmissionField('submission-1', 'field-routing');

    expect(mockRpc).toHaveBeenCalledWith('mhd_reveal_submission_field', {
      p_submission_id: 'submission-1',
      p_field_id: 'field-routing',
    });
    expect(plaintext).toBe('021000021');
  });

  it('surfaces RPC errors (e.g. the database role gate)', async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not authorized to reveal encrypted field values' },
    });

    await expect(mhdFormService.revealSubmissionField('submission-1', 'field-routing')).rejects.toThrow(
      'Unable to reveal encrypted field: Not authorized to reveal encrypted field values',
    );
  });
});

describe('MhdFormSubmissionReview encrypted values', () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockUseMhdAuth.mockReset();
  });

  it('renders a masked placeholder instead of the value', () => {
    mockAuth(['Platform Admin']);
    render(<MhdFormSubmissionReview submission={maskedSubmission} />);

    expect(screen.getByText('•••••• (encrypted)')).toBeInTheDocument();
    // Non-encrypted values still render normally.
    expect(screen.getByText('First National Test Bank')).toBeInTheDocument();
  });

  it.each<MhdAuthRoleName>(['Platform Admin', 'HR Partner', 'Client Admin'])(
    'shows the Reveal button for a %s',
    (role) => {
      mockAuth([role]);
      render(<MhdFormSubmissionReview submission={maskedSubmission} />);

      expect(screen.getByRole('button', { name: 'Reveal' })).toBeInTheDocument();
    },
  );

  it.each<MhdAuthRoleName>(['Client User', 'Viewer'])('hides the Reveal button for a %s', (role) => {
    mockAuth([role]);
    render(<MhdFormSubmissionReview submission={maskedSubmission} />);

    expect(screen.getByText('•••••• (encrypted)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reveal' })).not.toBeInTheDocument();
  });

  it('reveals the plaintext transiently via the audited RPC and can hide it again', async () => {
    mockAuth(['HR Partner']);
    mockRpc.mockResolvedValueOnce({ data: '021000021', error: null });
    const user = userEvent.setup();

    render(<MhdFormSubmissionReview submission={maskedSubmission} />);

    await user.click(screen.getByRole('button', { name: 'Reveal' }));

    await waitFor(() => {
      expect(screen.getByText('021000021')).toBeInTheDocument();
    });
    expect(mockRpc).toHaveBeenCalledWith('mhd_reveal_submission_field', {
      p_submission_id: 'submission-1',
      p_field_id: 'field-routing',
    });

    await user.click(screen.getByRole('button', { name: 'Hide' }));
    expect(screen.queryByText('021000021')).not.toBeInTheDocument();
    expect(screen.getByText('•••••• (encrypted)')).toBeInTheDocument();
  });

  it('shows the RPC error when the reveal is rejected', async () => {
    mockAuth(['Client Admin']);
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not authorized to reveal encrypted field values' },
    });
    const user = userEvent.setup();

    render(<MhdFormSubmissionReview submission={maskedSubmission} />);

    await user.click(screen.getByRole('button', { name: 'Reveal' }));

    await waitFor(() => {
      expect(
        screen.getByText('Unable to reveal encrypted field: Not authorized to reveal encrypted field values'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('021000021')).not.toBeInTheDocument();
  });
});
