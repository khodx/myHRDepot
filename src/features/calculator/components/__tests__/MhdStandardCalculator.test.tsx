import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdStandardCalculator } from '../MhdStandardCalculator';
import { mhdReadCalculatorHistory } from '../../historyStore';

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => ({ authUserId: 'user-1' }) }));

describe('MhdStandardCalculator', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      get length() { return values.size; },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => [...values.keys()][index] ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    });
  });

  async function setup() {
    const user = userEvent.setup();
    render(<MhdStandardCalculator />);
    return user;
  }

  it('builds an expression from digit and operator entry', async () => {
    const user = await setup();
    await user.click(screen.getByRole('button', { name: '1' }));
    await user.click(screen.getByRole('button', { name: '+' }));
    await user.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByText('1 + 2')).toBeInTheDocument();
  });

  it.each([['+', '1', '2'], ['−', '1', '2'], ['×', '2', '3'], ['÷', '6', '2'], ['%', '5', '2']])('supports %s', async (operator, left, right) => {
    const user = await setup();
    await user.click(screen.getByRole('button', { name: left }));
    await user.click(screen.getByRole('button', { name: operator }));
    await user.click(screen.getByRole('button', { name: right }));
    expect(screen.getByText(`${left} ${operator} ${right}`)).toBeInTheDocument();
  });

  it('calculates and writes a history entry', async () => {
    const user = await setup();
    await user.click(screen.getByRole('button', { name: '7' }));
    await user.click(screen.getByRole('button', { name: '×' }));
    await user.click(screen.getByRole('button', { name: '6' }));
    await user.click(screen.getByRole('button', { name: '=' }));
    expect(screen.getAllByText('42').length).toBeGreaterThan(0);
    expect(mhdReadCalculatorHistory('user-1')[0]).toMatchObject({ mode: 'standard', result: 42 });
  });

  it('clears state and round-trips memory', async () => {
    const user = await setup();
    await user.click(screen.getByRole('button', { name: '8' }));
    await user.click(screen.getByRole('button', { name: 'M+' }));
    await user.click(screen.getByRole('button', { name: 'C' }));
    await user.click(screen.getByRole('button', { name: 'MR' }));
    expect(within(screen.getByLabelText('Standard calculator')).getAllByText('8').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'MC' }));
    await user.click(screen.getByRole('button', { name: 'C' }));
    await user.click(screen.getByRole('button', { name: 'MR' }));
    expect(within(screen.getByLabelText('Standard calculator')).getAllByText('0').length).toBeGreaterThan(0);
  });

  it('recalls a history result as a new starting value', async () => {
    const user = await setup();
    await user.click(screen.getByRole('button', { name: '9' }));
    await user.click(screen.getByRole('button', { name: '=' }));
    const historyResult = screen.getAllByText('9');
    await user.click(historyResult[historyResult.length - 1]);
    expect(within(screen.getByLabelText('Standard calculator')).getAllByText('9').length).toBeGreaterThan(0);
  });
});
