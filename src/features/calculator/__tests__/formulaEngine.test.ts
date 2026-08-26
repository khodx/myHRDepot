import { describe, expect, it } from 'vitest';
import { mhdEvaluateFormula, mhdParseFormula } from '../formulaEngine';

describe('mhd formula engine', () => {
  it('evaluates operators and precedence', () => {
    expect(mhdEvaluateFormula('2 + 3 * 4', {})).toBe(14);
    expect(mhdEvaluateFormula('(2 + 3) * 4 - 8 / 2 % 3', {})).toBe(19);
    expect(mhdEvaluateFormula('2 ^ 3 ^ 2', {})).toBe(512);
    expect(mhdEvaluateFormula('-2 + 5', {})).toBe(3);
  });
  it('evaluates comparisons and nested ternaries', () => {
    for (const [operator, expected] of [['>', 0], ['<', 0], ['>=', 1], ['<=', 1], ['==', 1], ['!=', 0] ] as const) expect(mhdEvaluateFormula(`3 ${operator} 3`, {})).toBe(expected);
    expect(mhdEvaluateFormula('2 > 1 ? 10 : 20', {})).toBe(10);
    expect(mhdEvaluateFormula('0 ? 1 : 4 > 2 ? 7 : 8', {})).toBe(7);
  });
  it('evaluates every built-in function', () => {
    expect(mhdEvaluateFormula('min(4, 2)', {})).toBe(2);
    expect(mhdEvaluateFormula('max(4, 2)', {})).toBe(4);
    expect(mhdEvaluateFormula('round(2.56)', {})).toBe(3);
    expect(mhdEvaluateFormula('round(2.567, 2)', {})).toBe(2.57);
    expect(mhdEvaluateFormula('abs(-4) + floor(2.9) + ceil(2.1)', {})).toBe(9);
  });
  it('resolves fields and reports missing fields', () => {
    expect(mhdParseFormula('hours * rate').fieldReferences).toEqual(['hours', 'rate']);
    expect(mhdEvaluateFormula('hours * rate', { hours: 8, rate: 20 })).toBe(160);
    expect(() => mhdEvaluateFormula('hours + rate', { hours: 8 })).toThrow('Missing value for "rate"');
  });
  it('evaluates the seeded California daily overtime formula', () => {
    const formula = 'hours <= 8 ? hours * rate : hours <= 12 ? 8 * rate + (hours - 8) * rate * 1.5 : 8 * rate + 4 * rate * 1.5 + (hours - 12) * rate * 2';
    expect(mhdEvaluateFormula(formula, { hours: 13, rate: 20 })).toBe(320);
  });
  it('rejects malformed syntax and unknown functions', () => {
    for (const formula of ['', '(2 + 3', '2 +', 'wat(2)']) {
      const result = mhdParseFormula(formula);
      expect(result.ok).toBe(false); expect(result.error).toBeTruthy();
      expect(() => mhdEvaluateFormula(formula, {})).toThrow();
    }
  });
  it('rejects division by zero and non-finite results', () => {
    expect(() => mhdEvaluateFormula('10 / 0', {})).toThrow('division by zero');
    expect(() => mhdEvaluateFormula('0 / 0', {})).toThrow('division by zero');
  });
  it('treats a hyphen adjacent to a field name as subtraction, not part of the identifier', () => {
    // Regression: the identifier tokenizer must stop at '-' so
    // `hours-8` parses as `hours - 8`, not a single identifier `hours-8`.
    expect(mhdParseFormula('hours-8').fieldReferences).toEqual(['hours']);
    expect(mhdEvaluateFormula('hours-8', { hours: 20 })).toBe(12);
  });
});
