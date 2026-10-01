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
      parentSectionKey: null,
      depth: 0,
      outlineNumber: '1',
    },
    {
      jurisdiction: 'CA',
      sectionKey: 'ca-meal-periods',
      title: 'Meal and Rest Periods',
      body: MHD_HANDBOOK_ATTORNEY_PLACEHOLDER,
      parentSectionKey: null,
      depth: 0,
      outlineNumber: '2',
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

  it('numbers and indents subsections by outline depth', () => {
    versionMock.mockReturnValue({
      data: {
        ...FROZEN,
        assembledContent: [
          { ...FROZEN.assembledContent[0], outlineNumber: '1', depth: 0 },
          {
            ...FROZEN.assembledContent[1],
            sectionKey: 'sub',
            title: 'Overtime Rules',
            parentSectionKey: 'at-will',
            outlineNumber: '1.1',
            depth: 1,
          },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<MhdHandbookVersionView versionId="ver-1" />);

    expect(screen.getByText('1.1')).toBeInTheDocument();
    const subsection = screen.getByText('Overtime Rules').closest('li');
    expect(subsection).toHaveStyle({ marginLeft: '1.25rem' });
    const topLevel = screen.getByText('At-Will Employment').closest('li');
    expect(topLevel).toHaveStyle({ marginLeft: '0rem' });
  });

  it('renders a version published before the hierarchy existed as a flat, unnumbered list', () => {
    versionMock.mockReturnValue({
      data: {
        ...FROZEN,
        assembledContent: FROZEN.assembledContent.map((section) => ({
          ...section,
          parentSectionKey: null,
          depth: 0,
          outlineNumber: null,
        })),
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<MhdHandbookVersionView versionId="ver-1" />);

    expect(screen.getByText('At-Will Employment')).toBeInTheDocument();
    expect(screen.queryByText('1.1')).toBeNull();
    expect(screen.getByText('At-Will Employment').closest('li')).toHaveStyle({
      marginLeft: '0rem',
    });
  });

  it('leads with the draft-review banner wherever a clause body shows', () => {
    versionMock.mockReturnValue({ data: FROZEN, isLoading: false, isError: false, error: null });

    render(<MhdHandbookVersionView versionId="ver-1" />);

    // The load-bearing guard: the draft-review banner must render alongside the bodies.
    expect(screen.getByText(/pending legal review/i)).toBeInTheDocument();
    // And the bodies themselves are the raw attorney placeholder, never real policy.
    expect(screen.getAllByText(MHD_HANDBOOK_ATTORNEY_PLACEHOLDER).length).toBeGreaterThan(0);
  });
});
