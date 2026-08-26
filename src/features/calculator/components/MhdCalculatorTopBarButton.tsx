import { useEffect, useRef, useState } from 'react';
import { Calculator } from 'lucide-react';
import { MhdGuidedCalculator } from './MhdGuidedCalculator';
import { MhdStandardCalculator } from './MhdStandardCalculator';

type CalculatorMode = 'standard' | 'guided';

export function MhdCalculatorTopBarButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<CalculatorMode>('standard');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        title="Calculator"
        aria-label="Calculator"
        aria-expanded={isOpen}
        className={`mhd-topbar-icon-btn inline-flex flex-col items-center justify-center gap-0.5 rounded-lg p-1.5 transition-colors ${
          isOpen ? 'bg-muted text-foreground' : 'text-muted-foreground'
        }`}
      >
        <Calculator className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" aria-hidden />
        <span aria-hidden className="text-sm font-medium leading-none whitespace-nowrap">
          Calculator
        </span>
      </button>

      {isOpen && (
        <section
          className="absolute left-0 top-full z-50 mt-2 max-h-[calc(100vh-92px)] w-[min(92vw,1100px)] overflow-y-auto rounded-lg border border-border bg-background p-4 shadow-lg"
          aria-label="Calculator panel"
        >
          <div className="mb-4 flex gap-1 border-b border-border" role="tablist" aria-label="Calculator mode">
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
        </section>
      )}
    </div>
  );
}
