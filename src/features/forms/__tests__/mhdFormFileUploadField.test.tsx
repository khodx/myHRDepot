import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdFormFileUploadField } from '../components/MhdFormFileUploadField';
import type { MhdFormField, MhdFormFileValue } from '../Types';

const field: MhdFormField = {
  id: 'field-1',
  type: 'file',
  label: 'Voided Check',
  required: true,
  hidden: false,
};

const uploadedReference: MhdFormFileValue = {
  driveFileId: 'drive-file-123',
  fileName: 'void-check.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 5,
  driveWebViewLink: 'https://drive.google.com/file/d/drive-file-123/view',
};

function selectFile(input: HTMLElement) {
  const file = new File(['hello'], 'void-check.pdf', { type: 'application/pdf' });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

describe('MhdFormFileUploadField', () => {
  it('uploads through the provided pipeline and stores the Drive reference as the field value', async () => {
    const onUploadFile = vi.fn().mockResolvedValue(uploadedReference);
    const onChange = vi.fn();

    render(
      <MhdFormFileUploadField
        field={field}
        value={null}
        onChange={onChange}
        required
        onUploadFile={onUploadFile}
      />,
    );

    const file = selectFile(screen.getByLabelText(/voided check/i));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(uploadedReference));
    expect(onUploadFile).toHaveBeenCalledWith(file);
  });

  it('shows the uploaded file name with its Drive link once a reference is stored', () => {
    render(
      <MhdFormFileUploadField
        field={field}
        value={uploadedReference}
        onChange={vi.fn()}
        required
        onUploadFile={vi.fn()}
      />,
    );

    const link = screen.getByRole('link', { name: 'void-check.pdf' });
    expect(link).toHaveAttribute('href', uploadedReference.driveWebViewLink);
  });

  it('degrades gracefully on upload failure: inline error, existing value preserved', async () => {
    const onUploadFile = vi.fn().mockRejectedValue(new Error('Drive credentials missing'));
    const onChange = vi.fn();

    render(
      <MhdFormFileUploadField
        field={field}
        value={uploadedReference}
        onChange={onChange}
        required
        onUploadFile={onUploadFile}
      />,
    );

    selectFile(screen.getByLabelText(/voided check/i));

    expect(await screen.findByText('Drive credentials missing')).toBeInTheDocument();
    // The previous value (and therefore the draft) is not lost.
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'void-check.pdf' })).toBeInTheDocument();
  });

  it('disables the input when no upload pipeline is available (preview / read-only)', () => {
    render(<MhdFormFileUploadField field={field} value={null} onChange={vi.fn()} required />);

    expect(screen.getByLabelText(/voided check/i)).toBeDisabled();
    expect(screen.getByText('File uploads are available when filling out the live form.')).toBeInTheDocument();
  });
});
