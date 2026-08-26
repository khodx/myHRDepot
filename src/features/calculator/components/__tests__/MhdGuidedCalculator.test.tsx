import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdGuidedCalculator } from '../MhdGuidedCalculator';
import { mhdReadCalculatorHistory } from '../../historyStore';

const templates = [
  {
    id: 'hourly', templateKey: 'hourly-gross-pay', category: 'Pay & Wages', title: 'Hourly Gross Pay', description: 'Calculate gross pay from hours and hourly rate.', icon: 'DollarSign',
    inputFields: [
      { key: 'hours', label: 'Hours worked', type: 'number' as const, required: true, min: 0, step: 0.25, unit: 'hours' },
      { key: 'hourly_rate', label: 'Hourly rate', type: 'currency' as const, required: true, min: 0, step: 0.01, unit: '$' },
    ], formula: 'hours * hourly_rate', resultLabel: 'Gross pay', resultUnit: 'currency' as const, resultDecimals: 2, version: 1, isActive: true, createdAt: '', updatedAt: '',
  },
  {
    id: 'overtime', templateKey: 'weekly-overtime-pay', category: 'Pay & Wages', title: 'Weekly Overtime Pay', description: 'Estimate overtime earnings for a work week.', icon: 'Clock',
    inputFields: [
      { key: 'regular_hours', label: 'Regular hours', type: 'number' as const, required: true, unit: 'hours' },
      { key: 'overtime_hours', label: 'Overtime hours', type: 'integer' as const, required: true, unit: 'hours' },
      { key: 'rate', label: 'Hourly rate', type: 'currency' as const, required: true, unit: '$' },
      { key: 'multiplier', label: 'Overtime multiplier', type: 'select' as const, required: true, options: [{ value: '1.5', label: '1.5×' }, { value: '2', label: '2×' }] },
    ], formula: 'regular_hours + overtime_hours * multiplier', resultLabel: 'Paid hours', resultUnit: 'hours' as const, resultDecimals: 1, version: 1, isActive: true, createdAt: '', updatedAt: '',
  },
  {
    id: 'break-even', templateKey: 'break-even-units', category: 'Business & Finance', title: 'Break-even Units', description: 'Find units needed to break even.', icon: 'Calculator',
    inputFields: [
      { key: 'fixed_costs', label: 'Fixed costs', type: 'currency' as const, required: true, unit: '$' },
      { key: 'price_per_unit', label: 'Price per unit', type: 'currency' as const, required: true, unit: '$' },
      { key: 'variable_cost_per_unit', label: 'Variable cost per unit', type: 'currency' as const, required: true, unit: '$' },
    ], formula: 'fixed_costs / (price_per_unit - variable_cost_per_unit)', resultLabel: 'Break-even units', resultUnit: 'number' as const, resultDecimals: 0, version: 1, isActive: true, createdAt: '', updatedAt: '',
  },
];

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => ({ authUserId: 'user-1' }) }));
vi.mock('../../Hook', () => ({ useMhdCalculatorTemplates: () => ({ data: templates, isLoading: false, isError: false }) }));

describe('MhdGuidedCalculator', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    });
    vi.stubGlobal('crypto', { randomUUID: () => 'history-1' });
  });

  it('filters templates by title and description', async () => {
    const user = userEvent.setup();
    render(<MhdGuidedCalculator />);
    await user.type(screen.getByRole('textbox', { name: 'Search calculators' }), 'overtime');
    expect(screen.getByRole('button', { name: /Weekly Overtime Pay/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Hourly Gross Pay/ })).not.toBeInTheDocument();
  });

  it('renders the selected template field shape', async () => {
    const user = userEvent.setup();
    render(<MhdGuidedCalculator />);
    await user.click(screen.getByRole('button', { name: /Hourly Gross Pay/ }));
    expect(screen.getByLabelText(/Hours worked/)).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText(/Hourly rate/)).toHaveAttribute('step', '0.01');
    await user.click(screen.getByRole('button', { name: /Weekly Overtime Pay/ }));
    expect(screen.getByLabelText(/Overtime multiplier/).tagName).toBe('SELECT');
    expect(screen.getByLabelText(/Regular hours/)).toBeInTheDocument();
  });

  it('evaluates valid input, formats the result, and records history', async () => {
    const user = userEvent.setup();
    render(<MhdGuidedCalculator />);
    await user.click(screen.getByRole('button', { name: /Hourly Gross Pay/ }));
    await user.type(screen.getByLabelText(/Hours worked/), '40');
    await user.type(screen.getByLabelText(/Hourly rate/), '25');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(mhdReadCalculatorHistory('user-1')[0]).toMatchObject({ mode: 'guided', result: 1000, label: 'Hourly Gross Pay' });
  });

  it('shows evaluator errors inline', async () => {
    const user = userEvent.setup();
    render(<MhdGuidedCalculator />);
    await user.click(screen.getByRole('button', { name: /Break-even Units/ }));
    await user.type(screen.getByLabelText(/Fixed costs/), '100');
    await user.type(screen.getByLabelText(/Price per unit/), '10');
    await user.type(screen.getByLabelText(/Variable cost per unit/), '10');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByRole('alert')).toHaveTextContent('division by zero');
  });

  it('blocks submission and identifies a missing required field', async () => {
    const user = userEvent.setup();
    render(<MhdGuidedCalculator />);
    await user.click(screen.getByRole('button', { name: /Hourly Gross Pay/ }));
    await user.type(screen.getByLabelText(/Hours worked/), '40');
    await user.click(screen.getByRole('button', { name: 'Calculate' }));
    expect(screen.getByRole('alert')).toHaveTextContent('This field is required.');
    expect(screen.queryByText('$1,000.00')).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Calculator templates' })).getByText('Pay & Wages')).toBeInTheDocument();
  });
});
