import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdDocumentLetterheadPage } from '../components/MhdDocumentLetterheadPage';

const saveMock = vi.fn();
const authState = { profile: { companyId: 'company-1' }, roles: ['Client Admin'] as string[] };
const branding = {
  id: 'branding-1',
  companyId: 'company-1',
  isPlatformDefault: true,
  headerText: 'People Ops',
  footerText: 'Confidential',
  accentColor: '#0003AA',
  fontFamily: 'Arial' as const,
  logoDataUri: null,
  showReferenceId: true,
};

vi.mock('../Hook', () => ({
  useMhdDocumentBranding: () => ({ data: branding, isLoading: false, isError: false }),
  useMhdSaveDocumentBranding: () => ({ mutateAsync: saveMock, isPending: false }),
}));
vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => authState }));

function renderPage() {
  return render(
    <MemoryRouter>
      <MhdDocumentLetterheadPage />
    </MemoryRouter>,
  );
}

describe('MhdDocumentLetterheadPage', () => {
  beforeEach(() => {
    saveMock.mockReset().mockResolvedValue('saved-id');
    authState.roles = ['Client Admin'];
  });

  it('loads fields and shows the platform-default note and preview', () => {
    renderPage();
    expect(screen.getByDisplayValue('People Ops')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Confidential')).toBeInTheDocument();
    expect(
      screen.getByText('Your company is using the platform default. Saving creates your own.'),
    ).toBeInTheDocument();
    expect(screen.getByText('People Ops')).toBeInTheDocument();
    expect(screen.getByText('Confidential')).toBeInTheDocument();
  });

  it('keeps colour inputs in sync and reports invalid hex on save', async () => {
    renderPage();
    const hex = screen.getByLabelText('Accent colour hex');
    fireEvent.change(hex, { target: { value: '#123' } });
    expect(hex).toHaveValue('#123');
    fireEvent.click(screen.getByRole('button', { name: 'Save Letterhead' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The accent color must be a six-digit hex value',
    );
  });

  it('rejects bad logos, accepts a PNG data URI, and can remove it', async () => {
    renderPage();
    const input = screen.getByLabelText('Logo');
    const badFile = new File(['bad'], 'logo.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [badFile] } });
    expect(screen.getByText('Logo must be a PNG, JPEG or GIF image.')).toBeInTheDocument();
    const oversized = new File([new Uint8Array(300 * 1024 + 1)], 'large.png', {
      type: 'image/png',
    });
    fireEvent.change(input, { target: { files: [oversized] } });
    expect(screen.getByText('Logo must be 300 KB or smaller.')).toBeInTheDocument();
    const png = new File([new Uint8Array([137, 80, 78, 71])], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [png] } });
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Remove Logo' })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save Letterhead' }));
    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    expect(saveMock.mock.calls[0][0].logoDataUri).toMatch(/^data:image\/png;base64,/);
    fireEvent.click(screen.getByRole('button', { name: 'Remove Logo' }));
    expect(screen.queryByRole('button', { name: 'Remove Logo' })).not.toBeInTheDocument();
  });

  it('saves the profile company id and hides scope for non-platform admins', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Header Line'), { target: { value: 'Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Letterhead' }));
    await waitFor(() =>
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'company-1', headerText: 'Updated' }),
      ),
    );
    expect(screen.queryByLabelText('Scope')).not.toBeInTheDocument();
  });

  it('shows platform scope only to platform admins and sends null for that scope', async () => {
    authState.roles = ['Platform Admin'];
    renderPage();
    fireEvent.change(screen.getByLabelText('Scope'), { target: { value: 'platform' } });
    fireEvent.change(screen.getByLabelText('Header Line'), { target: { value: 'Platform' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Letterhead' }));
    await waitFor(() =>
      expect(saveMock).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: null, headerText: 'Platform' }),
      ),
    );
  });

  it('renders read-only for users without document-template mutation permission', () => {
    authState.roles = ['Employee'];
    renderPage();
    expect(
      screen.getByText('You have view-only access to document letterhead settings.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Letterhead' })).toBeDisabled();
    expect(screen.getByLabelText('Header Line')).toBeDisabled();
  });
});
