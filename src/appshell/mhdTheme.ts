/**
 * App theme (light default, opt-in dark). The initial class is applied by an
 * inline script in index.html before first paint; this module keeps the runtime
 * toggle and persistence in one place. Nothing reads prefers-color-scheme — the
 * OS setting never forces dark; the user chooses.
 */
export type MhdTheme = 'light' | 'dark';

const MHD_THEME_KEY = 'mhd:theme';

export function mhdGetStoredTheme(): MhdTheme {
  try {
    return window.localStorage.getItem(MHD_THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function mhdApplyTheme(theme: MhdTheme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    window.localStorage.setItem(MHD_THEME_KEY, theme);
  } catch {
    // localStorage unavailable — the class is still applied for this session.
  }
}
