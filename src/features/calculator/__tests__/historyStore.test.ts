import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mhdAppendCalculatorHistoryEntry,
  mhdClearCalculatorHistory,
  mhdReadCalculatorHistory,
} from '../historyStore';

function createLocalStorageStub(): Storage {
  const values = new Map<string, string>();

  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

const entry = {
  mode: 'standard' as const,
  label: '42 × 3.5',
  expression: '42 * 3.5',
  result: 147,
};

describe('calculator history store', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageStub());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an empty list when no history exists', () => {
    expect(mhdReadCalculatorHistory('user-a')).toEqual([]);
  });

  it('round-trips appended entries', () => {
    const appended = mhdAppendCalculatorHistoryEntry('user-a', entry);

    expect(appended).toHaveLength(1);
    expect(mhdReadCalculatorHistory('user-a')).toEqual(appended);
    expect(appended[0]).toMatchObject(entry);
    expect(appended[0].id).toEqual(expect.any(String));
    expect(appended[0].timestamp).toEqual(expect.any(Number));
  });

  it('caps history at 50 entries and keeps the newest first', () => {
    for (let index = 0; index < 51; index += 1) {
      mhdAppendCalculatorHistoryEntry('user-a', {
        ...entry,
        label: `Entry ${index}`,
        expression: String(index),
        result: index,
      });
    }

    const history = mhdReadCalculatorHistory('user-a');
    expect(history).toHaveLength(50);
    expect(history[0].result).toBe(50);
    expect(history.at(-1)?.result).toBe(1);
    expect(history.some((item) => item.result === 0)).toBe(false);
  });

  it('keeps different users’ histories separate', () => {
    mhdAppendCalculatorHistoryEntry('user-a', entry);
    mhdAppendCalculatorHistoryEntry('user-b', { ...entry, result: 999 });

    expect(mhdReadCalculatorHistory('user-a')[0].result).toBe(147);
    expect(mhdReadCalculatorHistory('user-b')[0].result).toBe(999);
  });

  it('returns an empty list for corrupted stored JSON', () => {
    localStorage.setItem('mhd-calculator-history:user-a', '{not valid json');

    expect(() => mhdReadCalculatorHistory('user-a')).not.toThrow();
    expect(mhdReadCalculatorHistory('user-a')).toEqual([]);
  });

  it('rejects parsed values that do not match the entry shape', () => {
    localStorage.setItem(
      'mhd-calculator-history:user-a',
      JSON.stringify([{ id: 'x', mode: 'standard', label: 'x' }]),
    );

    expect(mhdReadCalculatorHistory('user-a')).toEqual([]);
  });

  it('clears only the requested user’s history', () => {
    mhdAppendCalculatorHistoryEntry('user-a', entry);
    mhdAppendCalculatorHistoryEntry('user-b', { ...entry, result: 999 });

    mhdClearCalculatorHistory('user-a');

    expect(mhdReadCalculatorHistory('user-a')).toEqual([]);
    expect(mhdReadCalculatorHistory('user-b')).toHaveLength(1);
  });
});
