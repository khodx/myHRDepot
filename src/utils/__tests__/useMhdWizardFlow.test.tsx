import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  mhdWizardErrorMessage,
  useMhdWizardFlow,
  type MhdWizardStepDefinition,
} from '../useMhdWizardFlow';

function setup(
  steps: MhdWizardStepDefinition[],
  options: { onSubmit?: () => Promise<unknown>; initialStepId?: string; isDirty?: boolean } = {},
) {
  return renderHook(
    (props: { steps: MhdWizardStepDefinition[] }) =>
      useMhdWizardFlow({
        steps: props.steps,
        onSubmit: options.onSubmit ?? (() => Promise.resolve()),
        initialStepId: options.initialStepId,
        isDirty: options.isDirty,
      }),
    { initialProps: { steps } },
  );
}

const plain = (id: string): MhdWizardStepDefinition => ({ id, title: id });

describe('useMhdWizardFlow', () => {
  it('starts on the first step, or on initialStepId when resuming', () => {
    expect(setup([plain('a'), plain('b')]).result.current.stepIndex).toBe(0);
    expect(setup([plain('a'), plain('b')], { initialStepId: 'b' }).result.current.stepIndex).toBe(1);
    expect(setup([plain('a'), plain('b')], { initialStepId: 'missing' }).result.current.stepIndex).toBe(0);
  });

  it('moves forward and back, and never runs validate or onLeave going back', async () => {
    const validate = vi.fn(() => null);
    const onLeave = vi.fn();
    const { result } = setup([{ ...plain('a'), validate, onLeave }, plain('b')]);

    await act(() => result.current.next());
    expect(result.current.stepIndex).toBe(1);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);

    await act(() => result.current.back());
    expect(result.current.stepIndex).toBe(0);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('blocks a forward move and surfaces the message when validate fails', async () => {
    const onLeave = vi.fn();
    const { result } = setup([{ ...plain('a'), validate: () => 'Choose a person.', onLeave }, plain('b')]);

    await act(() => result.current.next());

    expect(result.current.stepIndex).toBe(0);
    expect(result.current.error).toBe('Choose a person.');
    expect(onLeave).not.toHaveBeenCalled();
  });

  it('keeps the person on the step and shows the message when onLeave rejects', async () => {
    const { result } = setup([
      { ...plain('a'), onLeave: () => Promise.reject(new Error('Case could not be created.')) },
      plain('b'),
    ]);

    await act(() => result.current.next());

    expect(result.current.stepIndex).toBe(0);
    expect(result.current.error).toBe('Case could not be created.');
    expect(result.current.isAdvancing).toBe(false);
  });

  it('falls back to a generic message when the rejection carries none', async () => {
    const { result } = setup([{ ...plain('a'), onLeave: () => Promise.reject('nope') }, plain('b')]);
    await act(() => result.current.next());
    expect(result.current.error).toBe('Something went wrong. Please try again.');
  });

  it('validates and runs onLeave for every step crossed by a jump, in order', async () => {
    const calls: string[] = [];
    const { result } = setup([
      { ...plain('a'), validate: () => (calls.push('validate-a'), null), onLeave: () => void calls.push('leave-a') },
      { ...plain('b'), validate: () => (calls.push('validate-b'), null), onLeave: () => void calls.push('leave-b') },
      plain('c'),
    ]);

    await act(() => result.current.goTo(2));

    expect(calls).toEqual(['validate-a', 'leave-a', 'validate-b', 'leave-b']);
    expect(result.current.stepIndex).toBe(2);
    expect(result.current.furthestIndex).toBe(2);
  });

  it('stops a jump at the first step that fails, keeping the progress made before it', async () => {
    const { result } = setup([
      plain('a'),
      { ...plain('b'), validate: () => 'Fill in the details.' },
      plain('c'),
    ]);

    await act(() => result.current.goTo(2));

    expect(result.current.stepIndex).toBe(1);
    expect(result.current.error).toBe('Fill in the details.');
  });

  it('ignores a second move while one is still running', async () => {
    let release: () => void = () => undefined;
    const onLeave = vi.fn(() => new Promise<void>((resolve) => (release = resolve)));
    const { result } = setup([{ ...plain('a'), onLeave }, plain('b'), plain('c')]);

    let first: Promise<void> = Promise.resolve();
    await act(async () => {
      first = result.current.next();
    });
    expect(result.current.isAdvancing).toBe(true);
    await act(() => result.current.next());
    expect(onLeave).toHaveBeenCalledTimes(1);

    await act(async () => {
      release();
      await first;
    });
    expect(result.current.stepIndex).toBe(1);
  });

  it('clamps the position when the step list shrinks', async () => {
    const { result, rerender } = setup([plain('a'), plain('b'), plain('c')]);
    await act(() => result.current.goTo(2));
    rerender({ steps: [plain('a'), plain('b')] });
    expect(result.current.stepIndex).toBe(1);
    expect(result.current.isLastStep).toBe(true);
  });

  describe('runOnce', () => {
    it('runs an action once and gives later callers the same result', async () => {
      const { result } = setup([plain('a')]);
      const action = vi.fn(() => Promise.resolve('case-1'));

      const [first, second] = await act(async () => [
        await result.current.runOnce('create', action),
        await result.current.runOnce('create', action),
      ]);

      expect(first).toBe('case-1');
      expect(second).toBe('case-1');
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('lets a failed action be retried', async () => {
      const { result } = setup([plain('a')]);
      const action = vi
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('boom'))
        .mockResolvedValueOnce('ok');

      await expect(result.current.runOnce('create', action)).rejects.toThrow('boom');
      await expect(result.current.runOnce('create', action)).resolves.toBe('ok');
      expect(action).toHaveBeenCalledTimes(2);
    });

    it('runs again after resetOnce', async () => {
      const { result } = setup([plain('a')]);
      const action = vi.fn(() => Promise.resolve(1));

      await result.current.runOnce('evaluate', action);
      result.current.resetOnce('evaluate');
      await result.current.runOnce('evaluate', action);

      expect(action).toHaveBeenCalledTimes(2);
    });
  });

  describe('submit', () => {
    it('runs onSubmit, marks the flow complete and stops guarding unsaved input', async () => {
      const onSubmit = vi.fn(() => Promise.resolve());
      const { result } = setup([plain('a')], { onSubmit, isDirty: true });
      expect(result.current.guardUnsaved).toBe(true);

      await act(() => result.current.submit());

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(result.current.isComplete).toBe(true);
      expect(result.current.guardUnsaved).toBe(false);
    });

    it('shows a failed submit instead of throwing, and stays incomplete', async () => {
      const { result } = setup([plain('a')], {
        onSubmit: () => Promise.reject(new Error('Duplicate request.')),
        isDirty: true,
      });

      await act(() => result.current.submit());

      expect(result.current.error).toBe('Duplicate request.');
      expect(result.current.isComplete).toBe(false);
      expect(result.current.guardUnsaved).toBe(true);
    });

    it('does not submit while the current step is invalid', async () => {
      const onSubmit = vi.fn(() => Promise.resolve());
      const { result } = setup([{ ...plain('a'), validate: () => 'Describe the request.' }], { onSubmit });

      await act(() => result.current.submit());

      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Describe the request.');
    });
  });

  it('exposes stepper props that drive the same navigation', async () => {
    const { result } = setup([plain('a'), plain('b')]);
    expect(result.current.stepperProps.currentStepIndex).toBe(0);
    expect(result.current.stepperProps.validateCurrentStep()).toBe(true);

    await act(async () => result.current.stepperProps.onNavigate(1));
    expect(result.current.stepperProps.currentStepIndex).toBe(1);
  });
});

describe('mhdWizardErrorMessage', () => {
  it('prefers the thrown message and falls back otherwise', () => {
    expect(mhdWizardErrorMessage(new Error('Server says no'))).toBe('Server says no');
    expect(mhdWizardErrorMessage(new Error(''), 'Custom fallback')).toBe('Custom fallback');
    expect(mhdWizardErrorMessage('plain string', 'Custom fallback')).toBe('Custom fallback');
  });
});
