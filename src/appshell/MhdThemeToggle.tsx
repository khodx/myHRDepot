import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { mhdApplyTheme, mhdGetStoredTheme, type MhdTheme } from './mhdTheme';

/**
 * Light/dark toggle for the top bar. Light is the default; this flips to dark and
 * remembers the choice. The button shows the theme it will switch TO.
 */
export function MhdThemeToggle() {
  const [theme, setTheme] = useState<MhdTheme>(() => mhdGetStoredTheme());
  const next: MhdTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={() => {
        mhdApplyTheme(next);
        setTheme(next);
      }}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
