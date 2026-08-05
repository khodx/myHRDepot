import { beforeEach, describe, expect, it } from 'vitest';
import { mhdGetDeviceLabel, mhdGetOrCreateDeviceToken } from '../deviceToken';

function installLocalStorageStub() {
  const store = new Map<string, string>();
  const stub = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };

  Object.defineProperty(window, 'localStorage', { value: stub, configurable: true });
}

describe('deviceToken', () => {
  beforeEach(() => {
    installLocalStorageStub();
  });

  it('persists and returns the same device token across calls', () => {
    const firstToken = mhdGetOrCreateDeviceToken();
    const secondToken = mhdGetOrCreateDeviceToken();

    expect(firstToken).toEqual(expect.any(String));
    expect(firstToken.length).toBeGreaterThan(0);
    expect(secondToken).toBe(firstToken);
  });

  it('returns a non-empty best-effort device label', () => {
    const label = mhdGetDeviceLabel();

    expect(label).toEqual(expect.any(String));
    expect(label.length).toBeGreaterThan(0);
  });
});
