import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MhdHandbookPreview } from '../components/MhdHandbookPreview';
import { MhdHandbookAttorneyPendingBanner } from '../components/MhdHandbookAttorneyPendingBanner';
import { MHD_HANDBOOK_ATTORNEY_PLACEHOLDER, type MhdHandbookPreviewRow } from '../Types';

const ROWS: MhdHandbookPreviewRow[] = [
  {
    sectionId: 'sec-1',
    jurisdiction: 'FEDERAL',
    sectionKey: 'at-will',
    title: 'At-Will Employment',
    bodyPlaceholder: MHD_HANDBOOK_ATTORNEY_PLACEHOLDER,
    isRequired: true,
    sortOrder: 1,
  },
];

/**
 * The placeholder-banner presence test. This is the load-bearing SHELL guard:
 * every surface that renders a clause body must carry the visible
 * "attorney content pending — placeholder" banner so a human can never mistake the
 * placeholder skeleton for real policy. (The frozen version view is covered
 * separately in mhdHandbookVersionViewFrozen.test.tsx.)
 */
describe('handbook placeholder banner is present wherever a body renders', () => {
  it('renders the banner in the DRAFT preview alongside the placeholder body', () => {
    render(<MhdHandbookPreview rows={ROWS} />);

    expect(screen.getByText(/attorney content pending/i)).toBeInTheDocument();
    expect(screen.getByText(MHD_HANDBOOK_ATTORNEY_PLACEHOLDER)).toBeInTheDocument();
  });

  it('the banner names the shell posture — not legal content, never relied on by an employee', () => {
    render(<MhdHandbookAttorneyPendingBanner />);

    expect(screen.getByText(/attorney content pending/i)).toBeInTheDocument();
    expect(screen.getByText(/not legal content/i)).toBeInTheDocument();
  });
});
