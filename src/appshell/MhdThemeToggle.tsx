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
      className="mhd-topbar-icon-btn inline-flex flex-col items-center justify-center gap-0.5 rounded-lg p-1.5 text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-primary"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === 'dark' ? <Sun className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" /> : <Moon className="mhd-topbar-icon-glyph h-[39.6px] w-[39.6px]" />}
      <span aria-hidden className="text-xs font-medium leading-none whitespace-nowrap">Theme</span>
    </button>
  );
}
