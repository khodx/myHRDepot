import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  mockGetRequestByToken,
  mockRecordConsentViaToken,
  mockSignViaToken,
  mockDeclineViaToken,
} = vi.hoisted(() => ({
  mockGetRequestByToken: vi.fn(),
  mockRecordConsentViaToken: vi.fn(),
  mockSignViaToken: vi.fn(),
  mockDeclineViaToken: vi.fn(),
}));

vi.mock('../Service', () => ({
  mhdEsignatureService: {
    getRequestByToken: mockGetRequestByToken,
    recordConsentViaToken: mockRecordConsentViaToken,
    signViaToken: mockSignViaToken,
    declineViaToken: mockDeclineViaToken,
  },
}));

const { MhdPublicSigningPage } = await import('../components/MhdPublicSigningPage');

const unsignedRequest = {
  requestId: 'request-1',
  referenceId: 'ESIG-000101',
  documentName: 'Offer Letter',
  documentDriveFileId: 'drive-original-1',
  documentHash: '74cfebe028f35431cc5f299750404a1521c3996dace470171029b6d71bd6a75c',
  signedDriveFileId: null,
  disclosureText: 'Disclosure text for testing.',
  disclosureVersion: '2026-07-17',
  requestStatus: 'PENDING' as const,
  signingOrder: 'SEQUENTIAL' as const,
  signerId: 'signer-1',
  signerName: 'Casey Signer',
  signerStatus: 'VIEWED' as const,
  signerOrderPosition: 1,
  consentedAt: null,
};

const consentedRequest = {
  ...unsignedRequest,
  consentedAt: '2026-07-17T20:15:00Z',
};

describe('MhdPublicSigningPage', () => {
  beforeEach(() => {
    mockGetRequestByToken.mockReset();
    mockRecordConsentViaToken.mockReset();
    mockSignViaToken.mockReset();
    mockDeclineViaToken.mockReset();
  });

  it('requires consent capture before showing the signing action', async () => {
    mockGetRequestByToken
      .mockResolvedValueOnce(unsignedRequest)
      .mockResolvedValueOnce(consentedRequest)
      .mockResolvedValueOnce({
        ...consentedRequest,
        requestStatus: 'COMPLETED' as const,
        signerStatus: 'SIGNED' as const,
        signedDriveFileId: 'drive-signed-1',
      });
    mockRecordConsentViaToken.mockResolvedValueOnce({
      requestId: 'request-1',
      signerId: 'signer-1',
      consentedAt: '2026-07-17T20:15:00Z',
    });
    mockSignViaToken.mockResolvedValueOnce(undefined);

    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/sign/test-token']}>
        <Routes>
          <Route path="/sign/:token" element={<MhdPublicSigningPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Consent to electronic records')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign Document' })).not.toBeInTheDocument();

    const continueButton = screen.getByRole('button', { name: 'Continue to Signing' });
    expect(continueButton).toBeDisabled();

    const checkboxes = screen.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      await user.click(checkbox);
    }

    expect(continueButton).toBeEnabled();
    await user.click(continueButton);

    await waitFor(() => {
      expect(mockRecordConsentViaToken).toHaveBeenCalledTimes(1);
    });
    expect(mockRecordConsentViaToken).toHaveBeenCalledWith(
      expect.objectContaining({
        signingToken: 'test-token',
        consentedToElectronicRecords: true,
        acknowledgedHardwareRequirements: true,
        acknowledgedPaperCopyRight: true,
        acknowledgedWithdrawalRight: true,
        agreedToUseElectronicSignature: true,
      }),
    );
    expect(mockSignViaToken).not.toHaveBeenCalled();

    expect(await screen.findByText('Type your signature and confirm intent')).toBeInTheDocument();
    const signButton = screen.getByRole('button', { name: 'Sign Document' });
    expect(signButton).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: /i intend to sign this document electronically/i }));
    expect(signButton).toBeEnabled();
    await user.click(signButton);

    await waitFor(() => {
      expect(mockSignViaToken).toHaveBeenCalledTimes(1);
    });
    expect(mockSignViaToken).toHaveBeenCalledWith(
      expect.objectContaining({
        signingToken: 'test-token',
        typedSignatureName: 'Casey Signer',
        intentToSign: true,
        presentedDocumentHash: unsignedRequest.documentHash,
      }),
    );

    expect(await screen.findByText('The signed record is complete')).toBeInTheDocument();
  });
});
