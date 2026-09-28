import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { MhdModal } from '@/components/ui/MhdModal';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdSearchNavigation } from './Service';

export interface MhdAssistantContextValue {
  openAssistant: (initialQuery?: string) => void;
}

const MhdAssistantContext = createContext<MhdAssistantContextValue | null>(null);

export function useMhdAssistant(): MhdAssistantContextValue {
  const context = useContext(MhdAssistantContext);

  if (!context) {
    throw new Error('useMhdAssistant must be used within a MhdAssistantProvider');
  }

  return context;
}

/**
 * Owns the assistant's open/query state and renders the floating launcher
 * button + search panel once, alongside `children` — so any descendant
 * (the floating button itself, or a dashboard callout) can open the exact
 * same panel instance via `useMhdAssistant().openAssistant()`. Moved here
 * from the original `MhdAssistantLauncher` component (Stage 2) unchanged in
 * behavior/styling.
 */
export function MhdAssistantProvider({ children }: { children: ReactNode }) {
  const { roles } = useMhdAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const matches = mhdSearchNavigation(query, roles);
  const inputRef = useRef<HTMLInputElement>(null);

  function openAssistant(initialQuery?: string) {
    setQuery(initialQuery ?? '');
    setIsOpen(true);
  }

  function closeAssistant() {
    setIsOpen(false);
  }

  return (
    <MhdAssistantContext.Provider value={{ openAssistant }}>
      {children}

      <button
        type="button"
        onClick={() => openAssistant()}
        aria-label="Open navigation assistant"
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-assistant text-assistant-on shadow-lg transition hover:bg-assistant-hover active:bg-assistant-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
      >
        <Sparkles className="h-5 w-5" aria-hidden />
      </button>

      {isOpen ? (
        <MhdModal onClose={closeAssistant} title="Find something" initialFocusRef={inputRef}>
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Find something</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ask where to find something, like 'time off' or 'employee files'.
              </p>
            </div>

            <label htmlFor="mhd-assistant-search" className="sr-only">
              Search navigation
            </label>
            <input
              id="mhd-assistant-search"
              ref={inputRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What are you looking for?"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            />

            {matches.length > 0 ? (
              <ul className="divide-y divide-border rounded-md border border-border">
                {matches.map((match) => (
                  <li key={match.route}>
                    <Link
                      to={match.route}
                      onClick={closeAssistant}
                      className="block px-3 py-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    >
                      <span className="block text-sm font-semibold text-foreground">{match.label}</span>{' '}
                      <span className="mt-1 block text-sm text-muted-foreground">{match.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : query.trim() ? (
              <p className="text-sm text-muted-foreground">No matches — try different words.</p>
            ) : null}
          </div>
        </MhdModal>
      ) : null}
    </MhdAssistantContext.Provider>
  );
}
