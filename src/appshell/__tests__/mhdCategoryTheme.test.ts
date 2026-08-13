import { describe, expect, it } from 'vitest';
import {
  MHD_CATEGORY_THEMES,
  mhdCategoryThemeForPath,
  type MhdCategoryTheme,
} from '../mhdModuleAccent';
// Raw stylesheet text — lets the suite prove the CSS token contract matches the
// resolver without rendering anything.
import globalCss from '../../styles/global.css?raw';

/* ------------------------------------------------------------------ */
/* Resolver: the 33-entry navigation inventory (spec §3)               */
/* ------------------------------------------------------------------ */

const NAV_INVENTORY: ReadonlyArray<[route: string, theme: MhdCategoryTheme]> = [
  ['/dashboard', 'dashboard'],
  ['/people', 'people-org'],
  ['/employees', 'people-org'],
  ['/companies', 'people-org'],
  ['/jobs', 'people-org'],
  ['/my-job', 'people-org'],
  ['/schedule', 'time-leave'],
  ['/attendance', 'time-leave'],
  ['/leaves', 'time-leave'],
  // Reasonable Accommodations shares the Leaves category rather than carrying a
  // hue of its own: an accommodation is frequently the continuation of a leave
  // (restrictions on return, leave exhaustion), and the two surfaces link to
  // each other in both directions.
  ['/accommodations', 'time-leave'],
  ['/mileage', 'time-leave'],
  ['/performance', 'talent'],
  ['/performance/invitations', 'talent'],
  ['/recruiting', 'talent'],
  ['/recruiting/eeo', 'talent'],
  ['/training', 'talent'],
  ['/my-training', 'talent'],
  ['/handbooks', 'talent'],
  ['/my-handbooks', 'talent'],
  ['/conduct', 'employee-relations'],
  ['/investigations', 'employee-relations'],
  ['/offboarding', 'employee-relations'],
  ['/tasks', 'work-tools'],
  ['/activities', 'work-tools'],
  ['/calendar', 'work-tools'],
  ['/forms', 'work-tools'],
  ['/approvals', 'work-tools'],
  ['/property', 'work-tools'],
  ['/esignature', 'work-tools'],
  ['/communications', 'work-tools'],
  ['/communications/messaging', 'work-tools'],
  ['/communications/system-alerts', 'work-tools'],
  ['/automations', 'work-tools'],
];

describe('mhdCategoryThemeForPath — navigation inventory', () => {
  it.each(NAV_INVENTORY)('%s → %s', (route, theme) => {
    expect(mhdCategoryThemeForPath(route)).toBe(theme);
  });

  it('maps the /payroll compatibility route to work-tools', () => {
    expect(mhdCategoryThemeForPath('/payroll')).toBe('work-tools');
  });
});

describe('mhdCategoryThemeForPath — descendant inheritance', () => {
  const DESCENDANTS: ReadonlyArray<[route: string, theme: MhdCategoryTheme]> = [
    // ≥1 dynamic/detail child per category
    ['/people/8f14e45f/edit', 'people-org'],
    ['/employees/8f14e45f', 'people-org'],
    ['/companies/42', 'people-org'],
    ['/jobs/123', 'people-org'],
    ['/jobs/competencies', 'people-org'],
    ['/leaves/cases/123', 'time-leave'],
    // A child page inherits its parent module's category theme; the
    // accommodation case detail never invents a palette of its own.
    ['/accommodations/case-1', 'time-leave'],
    ['/attendance/policy', 'time-leave'],
    ['/performance/reviews/rev-1', 'talent'],
    ['/performance/coaching/plan-1', 'talent'],
    ['/performance/invitations/inv-1', 'talent'],
    ['/performance/templates', 'talent'],
    ['/recruiting/requisitions/req-1', 'talent'],
    ['/recruiting/applications/app-1', 'talent'],
    ['/recruiting/interviews/int-1', 'talent'],
    ['/recruiting/questions', 'talent'],
    ['/handbooks/hb-1', 'talent'],
    ['/investigations/case-9', 'employee-relations'],
    ['/conduct/case-3', 'employee-relations'],
    ['/offboarding/case-7', 'employee-relations'],
    ['/tasks/1/notes', 'work-tools'],
    ['/approvals/appr-1', 'work-tools'],
    ['/forms/f-1/submissions', 'work-tools'],
    ['/property/item-1', 'work-tools'],
    ['/esignature/req-1', 'work-tools'],
    ['/activities/act-1', 'work-tools'],
    ['/communications/messaging/thread-1', 'work-tools'],
    ['/communications/system-alerts/alert-1', 'work-tools'],
    ['/automations/rule-1', 'work-tools'],
  ];

  it.each(DESCENDANTS)('%s inherits %s', (route, theme) => {
    expect(mhdCategoryThemeForPath(route)).toBe(theme);
  });
});

describe('mhdCategoryThemeForPath — boundaries and fallback', () => {
  it('returns undefined outside any mapped route', () => {
    expect(mhdCategoryThemeForPath('/settings')).toBeUndefined();
    expect(mhdCategoryThemeForPath('/login')).toBeUndefined();
    expect(mhdCategoryThemeForPath('/404')).toBeUndefined();
    expect(mhdCategoryThemeForPath('/')).toBeUndefined();
  });

  it('matches whole path segments only, never partial prefixes', () => {
    expect(mhdCategoryThemeForPath('/peopleX')).toBeUndefined();
    expect(mhdCategoryThemeForPath('/tasksy/1')).toBeUndefined();
    expect(mhdCategoryThemeForPath('/my-jobs')).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* CSS token contract (global brand theme spec, revised 2026-07-24)    */
/* ------------------------------------------------------------------ */

const REQUIRED_VARS = [
  '--mhd-accent:',
  '--mhd-rail:',
  '--mhd-accent-hover:',
  '--mhd-accent-pressed:',
  '--mhd-accent-tint:',
  '--mhd-accent-soft:',
  '--mhd-accent-border:',
  '--mhd-accent-on:',
  '--mhd-focus-ring:',
];

function themeBlock(theme: MhdCategoryTheme): string {
  const marker = `[data-mhd-theme='${theme}']`;
  const start = globalCss.indexOf(marker);
  expect(start, `missing CSS block for ${theme}`).toBeGreaterThan(-1);
  const end = globalCss.indexOf('}', start);
  return globalCss.slice(start, end);
}

describe('global.css category token contract', () => {
  it('defines exactly one block per category theme', () => {
    for (const theme of MHD_CATEGORY_THEMES) {
      const marker = `[data-mhd-theme='${theme}']`;
      const first = globalCss.indexOf(marker);
      // Occurs once in light rules; the dark override targets [data-mhd-theme]
      // without a key, so a second keyed occurrence would be a duplicate block.
      expect(globalCss.indexOf(marker, first + 1), `duplicate block for ${theme}`).toBe(-1);
    }
  });

  it.each(MHD_CATEGORY_THEMES.map((t) => [t] as const))(
    '%s block carries all nine theme variables',
    (theme) => {
      const block = themeBlock(theme);
      for (const varName of REQUIRED_VARS) {
        expect(block, `${theme} missing ${varName}`).toContain(varName);
      }
    },
  );

  it('contains no per-module blocks or data-module hooks', () => {
    expect(globalCss).not.toContain('data-module');
  });

  // 2026-07-30: dark navy rail (#00157A). All rail text is white — the
  // active nav item is called out solely by a raised bevel (box-shadow, see
  // MhdSidebar.tsx) on a pure white selected fill (no separate indicator
  // dot). --mhd-rail-selected is #FFFFFF (2026-07-30 layout revisions).
  // White is light, so --mhd-rail-selected-text flips to ink for contrast —
  // the one rail text token that isn't white. Hover and selected text get
  // their own tokens instead of the global --mhd-accent-on, which flips dark
  // under .dark for the app's light surfaces and would go unreadable on the
  // (always-dark) rail.
  it('gives the rail a dark navy surface with white text and a white selected fill', () => {
    expect(globalCss).toContain('--mhd-rail: #00157a;');
    expect(globalCss).toContain('--mhd-rail-surface: #0a2499;');
    expect(globalCss).toContain('--mhd-rail-hover: #12299e;');
    expect(globalCss).toContain('--mhd-rail-hover-text: #ffffff;');
    expect(globalCss).toContain('--mhd-rail-selected: #ffffff;');
    expect(globalCss).toContain('--mhd-rail-selected-text: #111827;');
    expect(globalCss).toContain('--mhd-rail-border: rgb(255 255 255 / 0.14);');
    expect(globalCss).toContain('--mhd-rail-text: #ffffff;');
    expect(globalCss).toContain('--mhd-rail-muted: #ffffff;');
  });

  it('does not carry an indicator-dot token anymore', () => {
    expect(globalCss).not.toContain('--mhd-rail-indicator');
    expect(globalCss).not.toContain('--color-rail-indicator');
  });

  it('pins every category block to the same dark navy rail', () => {
    for (const theme of MHD_CATEGORY_THEMES) {
      const block = themeBlock(theme).toLowerCase();
      expect(block).toContain('--mhd-rail: #00157a');
    }
  });
});

/* ------------------------------------------------------------------ */
/* Contrast (WCAG, spec §2 accessibility table)                        */
/* ------------------------------------------------------------------ */

const GLOBAL_BRAND_PALETTE = {
  primary: '#0003AA',
  on: '#FFFFFF',
} as const;

const PALETTE: Record<MhdCategoryTheme, typeof GLOBAL_BRAND_PALETTE> = {
  dashboard: GLOBAL_BRAND_PALETTE,
  'people-org': GLOBAL_BRAND_PALETTE,
  'time-leave': GLOBAL_BRAND_PALETTE,
  talent: GLOBAL_BRAND_PALETTE,
  'employee-relations': GLOBAL_BRAND_PALETTE,
  'work-tools': GLOBAL_BRAND_PALETTE,
};

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('category palette contrast', () => {
  it.each(MHD_CATEGORY_THEMES.map((t) => [t] as const))(
    '%s on-primary is the stronger ink and meets AA',
    (theme) => {
      const { primary, on } = PALETTE[theme];
      expect(contrast(primary, on)).toBeGreaterThanOrEqual(4.5);
      const alternative = on === '#FFFFFF' ? '#111827' : '#FFFFFF';
      expect(contrast(primary, on)).toBeGreaterThanOrEqual(contrast(primary, alternative));
    },
  );

  // The active nav item sits on --mhd-rail-selected (#FFFFFF), not the raw
  // --mhd-accent fill — guard its dedicated ink text token
  // (--mhd-rail-selected-text) meets AA there, and that the fill itself
  // still clears the 3:1 non-text/UI-component minimum against the plain
  // rail (it's the only "active" signal now that there's no separate
  // indicator dot).
  it('rail-selected-text (ink) meets AA on the white rail-selected fill', () => {
    expect(contrast('#ffffff', '#111827')).toBeGreaterThanOrEqual(4.5);
  });

  it('rail-selected fill clears the 3:1 UI-component minimum against the plain rail', () => {
    expect(contrast('#00157A', '#ffffff')).toBeGreaterThanOrEqual(3);
  });

  it.each(MHD_CATEGORY_THEMES.map((t) => [t] as const))(
    '%s CSS block carries the exact global brand primary HEX',
    (theme) => {
      // Case-insensitive: Prettier normalizes hex literals to lowercase.
      const block = themeBlock(theme).toLowerCase();
      expect(block).toContain(`--mhd-accent: ${PALETTE[theme].primary.toLowerCase()}`);
    },
  );
});

/* ------------------------------------------------------------------ */
/* Dark mode: the brand primary is unreadable as text on dark surfaces,
   so .dark brightens the interactive accent ramp (the rail keeps the
   exact brand hex). Guard the override and its contrast.               */
/* ------------------------------------------------------------------ */

const DARK_ACCENT = '#7d82fa';
const DARK_ACCENT_ON = '#111827';
const DARK_CARD = '#151b24';
const DARK_BACKGROUND = '#0b0e13';

describe('dark-mode accent contrast', () => {
  it('declares the brightened dark accent ramp with ink on-color', () => {
    const darkThemed = globalCss.indexOf('.dark [data-mhd-theme]');
    expect(darkThemed).toBeGreaterThan(-1);
    const block = globalCss.slice(darkThemed, globalCss.indexOf('}', darkThemed));
    expect(block).toContain(`--mhd-accent: ${DARK_ACCENT}`);
    expect(block).toContain(`--mhd-accent-on: ${DARK_ACCENT_ON}`);
    // The rail must NOT be re-declared in dark — it keeps the exact brand hex.
    expect(block).not.toContain('--mhd-rail:');
  });

  it('dark accent text meets AA on the dark card and background (≥4.5:1)', () => {
    expect(contrast(DARK_ACCENT, DARK_CARD)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DARK_ACCENT, DARK_BACKGROUND)).toBeGreaterThanOrEqual(4.5);
  });

  it('ink on-color meets AA on the dark accent fill (≥4.5:1)', () => {
    expect(contrast(DARK_ACCENT, DARK_ACCENT_ON)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(DARK_ACCENT, DARK_ACCENT_ON)).toBeGreaterThanOrEqual(
      contrast(DARK_ACCENT, '#FFFFFF'),
    );
  });

  it('dark semantic primary matches the brightened accent', () => {
    const darkRoot = globalCss.indexOf('--color-primary: #7d82fa');
    expect(darkRoot).toBeGreaterThan(-1);
  });
});
