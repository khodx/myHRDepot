import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MhdStepper, type MhdStep } from '../MhdStepper';

const steps: MhdStep[] = [
  { id: 'one', title: 'One' },
  { id: 'two', title: 'Two' },
  { id: 'three', title: 'Three' },
];

function renderStepper(overrides: Partial<ComponentProps<typeof MhdStepper>> = {}) {
  return render(
    <MhdStepper
      steps={steps}
      currentStepIndex={0}
      onNavigate={vi.fn()}
      validateCurrentStep={vi.fn(() => true)}
      onSubmit={vi.fn()}
      {...overrides}
    />,
  );
}

describe('MhdStepper', () => {
  it('disables Previous on the first step and does not navigate past the last step', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const { rerender } = renderStepper({ currentStepIndex: 0, onNavigate });

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onNavigate).toHaveBeenCalledWith(1);

    onNavigate.mockClear();
    rerender(
      <MhdStepper
        steps={steps}
        currentStepIndex={2}
        onNavigate={onNavigate}
        validateCurrentStep={vi.fn(() => true)}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('blocks navigation when validation fails', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const validateCurrentStep = vi.fn(() => false);
    renderStepper({ onNavigate, validateCurrentStep });

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(validateCurrentStep).toHaveBeenCalledOnce();
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('offers Submit only on the last step and submits after validation', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderStepper({ currentStepIndex: 2, onSubmit });

    await user.click(screen.getByRole('button', { name: 'Submit' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('suppresses Submit when showSubmit is false', () => {
    renderStepper({ currentStepIndex: 2, showSubmit: false });
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('uses a custom next-step resolver', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    const resolveNextStepIndex = vi.fn(() => 2);
    renderStepper({ onNavigate, resolveNextStepIndex });

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(resolveNextStepIndex).toHaveBeenCalledWith(0);
    expect(onNavigate).toHaveBeenCalledWith(2);
  });
});
