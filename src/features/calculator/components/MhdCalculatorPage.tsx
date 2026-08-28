import { useState } from 'react';
import { MhdGuidedCalculator } from './MhdGuidedCalculator';
import { MhdStandardCalculator } from './MhdStandardCalculator';

type CalculatorMode = 'standard' | 'guided';

export function MhdCalculatorPage() {
  const [mode, setMode] = useState<CalculatorMode>('standard');

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">HR calculations</p>
        <h1 className="mt-1 text-3xl font-bold text-foreground">Calculator</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          A standard calculator with saved history, plus guided templates for common HR
          calculations (pay, overtime, PTO accrual, and more).
        </p>
      </header>
      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Calculator mode">
        {(['standard', 'guided'] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            role="tab"
            aria-selected={mode === tab}
            onClick={() => setMode(tab)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === tab
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab === 'standard' ? 'Standard' : 'Guided'}
          </button>
        ))}
      </div>
      {mode === 'standard' ? <MhdStandardCalculator /> : <MhdGuidedCalculator />}
    </main>
  );
}
