import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MHD_DEFAULT_DEBOUNCE_DELAY_MS, useMhdDebouncedValue } from '../useMhdDebouncedValue';

describe('useMhdDebouncedValue', () => {
  afterEach(() => vi.useRealTimers());

  it('updates only after the configured delay', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useMhdDebouncedValue(value), {
      initialProps: { value: 'one' },
    });

    rerender({ value: 'two' });
    expect(result.current).toBe('one');
    act(() => {
      vi.advanceTimersByTime(MHD_DEFAULT_DEBOUNCE_DELAY_MS - 1);
    });
    expect(result.current).toBe('one');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('two');
  });

  it('restarts the delay when the value changes again', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useMhdDebouncedValue(value), {
      initialProps: { value: 'one' },
    });

    rerender({ value: 'two' });
    act(() => {
      vi.advanceTimersByTime(MHD_DEFAULT_DEBOUNCE_DELAY_MS - 1);
    });
    rerender({ value: 'three' });
    act(() => {
      vi.advanceTimersByTime(MHD_DEFAULT_DEBOUNCE_DELAY_MS - 1);
    });
    expect(result.current).toBe('one');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('three');
  });
});
