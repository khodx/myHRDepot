import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MhdNoteComposer } from '../MhdNoteComposer';

describe('MhdNoteComposer', () => {
  it('blocks submission behind a visibility confirmation and shows the matching role list', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<MhdNoteComposer isSaving={false} onCreate={onCreate} />);

    await user.type(screen.getByRole('textbox', { name: 'Note' }), 'Follow up with client.');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Note visibility' }), 'PRIVATE');
    await user.click(screen.getByRole('button', { name: 'Save Note' }));

    expect(onCreate).not.toHaveBeenCalled();
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByText(/Private Internal SHR/)).toBeInTheDocument();
    expect(dialog.getByText('Visible to Platform Admin only.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'I understand and proceed' }));
    expect(onCreate).toHaveBeenCalledWith(expect.anything(), 'Follow up with client.', 'PRIVATE');
  });

  it('keeps the draft when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    render(<MhdNoteComposer isSaving={false} onCreate={onCreate} />);

    const editor = screen.getByRole('textbox', { name: 'Note' });
    await user.type(editor, 'Draft to keep.');
    await user.click(screen.getByRole('button', { name: 'Save Note' }));
    await user.click(screen.getByRole('button', { name: /Cancel and post to a different Note field\/table/ }));

    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByText('Draft to keep.')).toBeInTheDocument();
  });
});
