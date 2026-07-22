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
 * The draft-review-banner presence test. This is the load-bearing guard:
 * every surface that renders a clause body must carry the visible
 * "Draft — pending legal review" banner so a reader always sees the content is a
 * draft pending counsel, not final policy. (The frozen version view is covered
 * separately in mhdHandbookVersionViewFrozen.test.tsx.)
 */
describe('handbook draft-review banner is present wherever a body renders', () => {
  it('renders the banner in the DRAFT preview alongside the body', () => {
    render(<MhdHandbookPreview rows={ROWS} />);

    expect(screen.getByText(/pending legal review/i)).toBeInTheDocument();
    expect(screen.getByText(MHD_HANDBOOK_ATTORNEY_PLACEHOLDER)).toBeInTheDocument();
  });

  it('the banner names the draft posture — not finalized by counsel, confirm before relying', () => {
    render(<MhdHandbookAttorneyPendingBanner />);

    expect(screen.getByText(/pending legal review/i)).toBeInTheDocument();
    expect(screen.getByText(/finalized by counsel/i)).toBeInTheDocument();
  });
});
