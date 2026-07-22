import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MhdHandbookVersion } from '../Types';
import { MHD_HANDBOOK_ATTORNEY_PLACEHOLDER } from '../Types';

// Mock the Hook so the version view renders against controlled frozen data with
// no query client / network.
const { versionMock } = vi.hoisted(() => ({ versionMock: vi.fn() }));

vi.mock('../Hook', () => ({
  useMhdHandbookVersion: versionMock,
}));

const { MhdHandbookVersionView } = await import('../components/MhdHandbookVersionView');

const FROZEN: MhdHandbookVersion = {
  id: 'ver-1',
  referenceId: 'HBV-0001',
  handbookId: 'hbk-1',
  versionNumber: 2,
  assembledContent: [
    {
      jurisdiction: 'FEDERAL',
      sectionKey: 'at-will',
      title: 'At-Will Employment',
      body: MHD_HANDBOOK_ATTORNEY_PLACEHOLDER,
    },
    {
      jurisdiction: 'CA',
      sectionKey: 'ca-meal-periods',
      title: 'Meal and Rest Periods',
      body: MHD_HANDBOOK_ATTORNEY_PLACEHOLDER,
    },
  ],
  contentHash: 'a1b2c3d4e5f6frozenhash',
  effectiveDate: '2026-08-01',
  documentGenerationId: null,
  publishedAt: '2026-07-20T00:00:00Z',
};

/**
 * The frozen-version render test. A published version is an IMMUTABLE snapshot an
 * employee acknowledged against a date — the view RENDERS it read-only and never
 * offers an edit. It must show the integrity anchor (the content hash) and the
 * frozen section bodies, and — because this is a SHELL wave — lead with the
 * attorney-content-pending banner over placeholder bodies.
 */
describe('MhdHandbookVersionView — a frozen version renders read-only', () => {
  it('renders the frozen sections + content hash with NO edit affordance', () => {
    versionMock.mockReturnValue({ data: FROZEN, isLoading: false, isError: false, error: null });

    render(<MhdHandbookVersionView versionId="ver-1" />);

    // The frozen content is present.
    expect(screen.getByText('Version 2')).toBeInTheDocument();
    expect(screen.getByText('At-Will Employment')).toBeInTheDocument();
    expect(screen.getByText('Meal and Rest Periods')).toBeInTheDocument();
    // The integrity anchor is shown — this is what makes the snapshot verifiable.
    expect(screen.getByText(/a1b2c3d4e5f6frozenhash/)).toBeInTheDocument();

    // Read-only: the immutable version view offers no inputs and no buttons — a
    // correction is a NEW version, never an edit to this frozen one.
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('leads with the attorney-content-pending banner wherever a clause body shows', () => {
    versionMock.mockReturnValue({ data: FROZEN, isLoading: false, isError: false, error: null });

    render(<MhdHandbookVersionView versionId="ver-1" />);

    // The load-bearing SHELL guard: the banner must render alongside the bodies.
    expect(screen.getByText(/attorney content pending/i)).toBeInTheDocument();
    // And the bodies themselves are the raw attorney placeholder, never real policy.
    expect(screen.getAllByText(MHD_HANDBOOK_ATTORNEY_PLACEHOLDER).length).toBeGreaterThan(0);
  });
});
