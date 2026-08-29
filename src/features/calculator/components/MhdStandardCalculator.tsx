import { useCallback, useEffect, useState } from 'react';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  mhdAppendCalculatorHistoryEntry,
  type MhdCalculatorHistoryEntry,
} from '../historyStore';
import { mhdEvaluateFormula } from '../formulaEngine';
import { MhdCalculatorHistory } from './MhdCalculatorHistory';

const keypad: Array<{ label: string; value: string; kind?: 'operator' | 'action' }> = [
  { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }, { label: '÷', value: '/', kind: 'operator' },
  { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '×', value: '*', kind: 'operator' },
  { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '−', value: '-', kind: 'operator' },
  { label: '0', value: '0' }, { label: '.', value: '.' }, { label: '%', value: '%', kind: 'operator' }, { label: '+', value: '+', kind: 'operator' },
];

function displayExpression(expression: string): string {
  return expression
    .replaceAll('*', '×')
    .replaceAll('/', '÷')
    .replaceAll('-', '−')
    .replace(/([+−×÷%])/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(10)));
}

export function MhdStandardCalculator() {
  const { authUserId } = useMhdAuth();
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');
  const [memory, setMemory] = useState(0);
  const [hasResult, setHasResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  function currentValue(): number {
    const value = Number(result);
    return Number.isFinite(value) ? value : 0;
  }

  const append = useCallback((value: string) => {
    setError(null);
    if (hasResult && !['+', '-', '*', '/', '%'].includes(value)) {
      setExpression(value === '.' ? '0.' : value);
      setResult(value === '.' ? '0' : value);
      setHasResult(false);
      return;
    }
    if (value === '.' && expression.split(/[+\-*/%]/).at(-1)?.includes('.')) return;
    if (['+', '-', '*', '/', '%'].includes(value) && (expression === '' || /[+\-*/%]$/.test(expression))) return;
    const next = expression + value;
    setExpression(next);
    if (!/[+\-*/%]$/.test(next)) {
      try {
        setResult(formatNumber(mhdEvaluateFormula(next, {})));
      } catch {
        setResult(next || '0');
      }
    }
  }, [expression, hasResult]);

  const clear = useCallback(() => {
    setExpression(''); setResult('0'); setHasResult(false); setError(null);
  }, []);

  const backspace = useCallback(() => {
    setError(null);
    const next = expression.slice(0, -1);
    setExpression(next); setResult(next || '0'); setHasResult(false);
  }, [expression]);

  const calculate = useCallback(() => {
    if (!expression || /[+\-*/%]$/.test(expression) || !authUserId) return;
    try {
      const value = mhdEvaluateFormula(expression, {});
      const formatted = formatNumber(value);
      mhdAppendCalculatorHistoryEntry(authUserId, {
        mode: 'standard', label: displayExpression(expression), expression, result: value,
      });
      setResult(formatted); setExpression(formatted); setHasResult(true); setError(null);
      setHistoryRefresh((current) => current + 1);
    } catch {
      setError('That calculation is not valid.');
    }
  }, [expression, authUserId]);

  function memoryAction(action: 'clear' | 'add' | 'subtract' | 'recall') {
    const value = currentValue();
    if (action === 'clear') setMemory(0);
    if (action === 'add') setMemory((stored) => stored + value);
    if (action === 'subtract') setMemory((stored) => stored - value);
    if (action === 'recall') {
      const recalled = formatNumber(memory);
      setExpression(recalled); setResult(recalled); setHasResult(true); setError(null);
    }
  }

  function recall(entry: MhdCalculatorHistoryEntry) {
    const recalled = formatNumber(entry.result);
    setExpression(recalled); setResult(recalled); setHasResult(true); setError(null);
  }

  // Listens on window rather than requiring the calculator to be clicked into
  // focus first, so the numpad/operator keys work as soon as the page is
  // open. Skips typing targets (inputs, textareas, contenteditable) so it
  // never steals keystrokes meant for something else on the page.
  useEffect(() => {
    function handleWindowKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const key = event.key;
      if (/^[0-9.]$/.test(key)) append(key);
      else if (['+', '-', '*', '/', '%'].includes(key)) append(key);
      else if (key === 'Enter' || key === '=') calculate();
      else if (key === 'Backspace') backspace();
      else if (key === 'Escape') clear();
      else return;
      event.preventDefault();
    }
    window.addEventListener('keydown', handleWindowKeyDown);
    return () => window.removeEventListener('keydown', handleWindowKeyDown);
  }, [append, backspace, calculate, clear]);

  const buttonClass = 'rounded-lg border border-border px-3 py-3 text-lg text-foreground transition-colors hover:bg-muted';
  const operatorClass = 'rounded-lg border border-border px-3 py-3 text-lg text-muted-foreground transition-colors hover:bg-muted';

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(280px,360px)_minmax(240px,1fr)]">
      <div
        className="rounded-lg border border-border bg-card p-4"
        aria-label="Standard calculator"
      >
        <div className="mb-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-right">
          <div className="min-h-6 truncate text-sm text-muted-foreground">{displayExpression(expression) || '0'}</div>
          <div className="min-h-10 truncate text-3xl font-semibold text-foreground" aria-live="polite">{error || result}</div>
        </div>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {(['MC', 'M-', 'M+', 'MR'] as const).map((label) => (
            <button type="button" key={label} onClick={() => memoryAction(label === 'MC' ? 'clear' : label === 'M+' ? 'add' : label === 'M-' ? 'subtract' : 'recall')} className={operatorClass}>{label}</button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button type="button" onClick={clear} className={operatorClass}>C</button>
          <button type="button" onClick={backspace} className={operatorClass} aria-label="Backspace">⌫</button>
          <span /> <span />
          {keypad.map((button) => <button type="button" key={button.label} onClick={() => append(button.value)} className={button.kind === 'operator' ? operatorClass : buttonClass}>{button.label}</button>)}
          <button type="button" onClick={calculate} className="col-span-4 rounded-lg border border-border bg-muted px-3 py-3 text-lg font-semibold text-foreground transition-colors hover:bg-muted/80">=</button>
        </div>
      </div>
      {authUserId ? <MhdCalculatorHistory userId={authUserId} onRecall={recall} refreshToken={historyRefresh} /> : <p className="text-sm text-muted-foreground">Sign in to save calculator history.</p>}
    </div>
  );
}
