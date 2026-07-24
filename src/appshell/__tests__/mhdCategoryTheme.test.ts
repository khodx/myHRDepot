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
/* Resolver: the 26-entry navigation inventory (spec §3)               */
/* ------------------------------------------------------------------ */

const NAV_INVENTORY: ReadonlyArray<[route: string, theme: MhdCategoryTheme]> = [
  ['/dashboard', 'dashboard'],
  ['/people', 'people-org'],
  ['/companies', 'people-org'],
  ['/jobs', 'people-org'],
  ['/my-job', 'people-org'],
  ['/schedule', 'time-leave'],
  ['/attendance', 'time-leave'],
  ['/leaves', 'time-leave'],
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
  ['/forms', 'work-tools'],
  ['/approvals', 'work-tools'],
  ['/property', 'work-tools'],
  ['/esignature', 'work-tools'],
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
    ['/companies/42', 'people-org'],
    ['/jobs/123', 'people-org'],
    ['/jobs/competencies', 'people-org'],
    ['/leaves/cases/123', 'time-leave'],
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
/* CSS token contract (spec §2)                                        */
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

  it('keeps the shared white-alpha rail scale at the spec opacities', () => {
    expect(globalCss).toContain('--mhd-rail-surface: rgb(255 255 255 / 0.06)');
    expect(globalCss).toContain('--mhd-rail-hover: rgb(255 255 255 / 0.08)');
    expect(globalCss).toContain('--mhd-rail-selected: rgb(255 255 255 / 0.16)');
    expect(globalCss).toContain('--mhd-rail-border: rgb(255 255 255 / 0.18)');
    expect(globalCss).toContain('--mhd-rail-text: rgb(255 255 255 / 0.82)');
    expect(globalCss).toContain('--mhd-rail-muted: rgb(255 255 255 / 0.72)');
  });
});

/* ------------------------------------------------------------------ */
/* Contrast (WCAG, spec §2 accessibility table)                        */
/* ------------------------------------------------------------------ */

const PALETTE: Record<MhdCategoryTheme, { primary: string; rail: string; on: string }> = {
  dashboard: { primary: '#0005E2', rail: '#0004A4', on: '#FFFFFF' },
  'people-org': { primary: '#E20000', rail: '#A80000', on: '#FFFFFF' },
  'time-leave': { primary: '#24C220', rail: '#177D15', on: '#111827' },
  talent: { primary: '#AE40AE', rail: '#682668', on: '#FFFFFF' },
  'employee-relations': { primary: '#949494', rail: '#494949', on: '#111827' },
  'work-tools': { primary: '#3483BE', rail: '#22557C', on: '#111827' },
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
    '%s on-primary is the stronger ink and meets the spec-documented floor',
    (theme) => {
      const { primary, on } = PALETTE[theme];
      // The spec's own contrast table documents Work Tools at P 4.34:1 (ink on
      // #3483BE — the stronger of white/ink); the other five exceed 4.5:1.
      const floor = theme === 'work-tools' ? 4.3 : 4.5;
      expect(contrast(primary, on)).toBeGreaterThanOrEqual(floor);
      const alternative = on === '#FFFFFF' ? '#111827' : '#FFFFFF';
      expect(contrast(primary, on)).toBeGreaterThanOrEqual(contrast(primary, alternative));
    },
  );

  it.each(MHD_CATEGORY_THEMES.map((t) => [t] as const))(
    '%s rail passes AA for white text (≥4.5:1)',
    (theme) => {
      expect(contrast(PALETTE[theme].rail, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(MHD_CATEGORY_THEMES.map((t) => [t] as const))(
    '%s CSS block carries the exact spec primary and rail HEX',
    (theme) => {
      // Case-insensitive: Prettier normalizes hex literals to lowercase.
      const block = themeBlock(theme).toLowerCase();
      expect(block).toContain(`--mhd-accent: ${PALETTE[theme].primary.toLowerCase()}`);
      expect(block).toContain(`--mhd-rail: ${PALETTE[theme].rail.toLowerCase()}`);
    },
  );
});
