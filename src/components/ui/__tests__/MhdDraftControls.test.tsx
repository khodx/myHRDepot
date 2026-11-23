import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MhdDraftController } from '@/features/drafts/Hook';
import { MhdDraftBanner, MhdSaveDraftButton } from '../MhdDraftControls';

function controller(overrides: Partial<MhdDraftController> = {}): MhdDraftController {
  return {
    draft: null,
    isLoading: false,
    isSaving: false,
    savedAt: null,
    saveError: null,
    save: vi.fn().mockResolvedValue(undefined),
    discard: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

const saved = {
  id: crypto.randomUUID(),
  draftKind: 'LEAVE_INTAKE',
  draftKey: 'new',
  title: null,
  stepKey: 'facts',
  payload: { basics: { reason: 'Family' } },
  updatedAt: '2026-11-22T16:00:00Z',
  expiresAt: '2026-12-22T16:00:00Z',
};

describe('MhdDraftBanner', () => {
  it('renders nothing without a saved draft', () => {
    const { container } = render(<MhdDraftBanner draft={controller()} onRestore={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('restores the payload and step, then hides', () => {
    const onRestore = vi.fn();
    render(<MhdDraftBanner draft={controller({ draft: saved })} onRestore={onRestore} />);
    fireEvent.click(screen.getByRole('button', { name: 'Resume Draft' }));
    expect(onRestore).toHaveBeenCalledWith(saved.payload, 'facts');
    expect(screen.queryByRole('button', { name: 'Resume Draft' })).toBeNull();
  });

  it('discards on Start Over and hides', async () => {
    const draft = controller({ draft: saved });
    render(<MhdDraftBanner draft={draft} onRestore={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start Over' }));
    expect(draft.discard).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Resume Draft' })).toBeNull());
  });

  it('stays hidden once a draft has been saved on this screen', () => {
    render(
      <MhdDraftBanner
        draft={controller({ draft: saved, savedAt: saved.updatedAt })}
        onRestore={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Resume Draft' })).toBeNull();
  });
});

describe('MhdSaveDraftButton', () => {
  it('saves the values current at the click, with the step and title', () => {
    const draft = controller();
    let value = 'first';
    render(
      <MhdSaveDraftButton
        draft={draft}
        getValues={() => ({ value })}
        stepKey="facts"
        title="Leave"
      />,
    );
    value = 'second';
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    expect(draft.save).toHaveBeenCalledWith({
      payload: { value: 'second' },
      stepKey: 'facts',
      title: 'Leave',
    });
  });

  it('shows the saved confirmation and any server refusal', () => {
    render(
      <MhdSaveDraftButton
        draft={controller({ savedAt: saved.updatedAt, saveError: 'Refused' })}
        getValues={() => ({})}
      />,
    );
    expect(screen.getByText(/Draft saved/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Refused');
  });

  it('disables while saving', () => {
    render(<MhdSaveDraftButton draft={controller({ isSaving: true })} getValues={() => ({})} />);
    expect(screen.getByRole('button', { name: 'Saving Draft...' })).toBeDisabled();
  });
});
