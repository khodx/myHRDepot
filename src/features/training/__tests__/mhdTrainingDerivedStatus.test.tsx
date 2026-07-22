import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// The board reads the derived status from this hook; mock it so we control the
// exact RPC row the component renders.
const { matrixMock } = vi.hoisted(() => ({ matrixMock: vi.fn() }));
vi.mock('../Hook', () => ({
  useMhdTrainingComplianceMatrix: matrixMock,
}));

const { MhdTrainingComplianceBoard } = await import('../components/MhdTrainingComplianceBoard');

/**
 * The derived-status render test. The compliance status is computed SERVER-SIDE
 * (mhd_training_compliance_status) from the frozen completion rows; the badge must
 * render whatever the RPC returned and NEVER recompute it from the dates.
 *
 * The acid case: a row the server marks EXPIRED whose `expires_at` is far in the
 * FUTURE. A client that (wrongly) re-derived status from `expires_at > now` would
 * flip this to CURRENT. The board must still show "Expired".
 */
describe('MhdTrainingComplianceBoard — renders the server-derived status, never recomputes', () => {
  it('shows EXPIRED verbatim even when expires_at is in the future', () => {
    matrixMock.mockReturnValue({
      data: [
        {
          personId: 'person-1',
          personDisplayName: 'Dana Doe',
          courseId: 'course-1',
          courseTitle: 'CA harassment',
          category: 'HARASSMENT',
          status: 'EXPIRED',
          // Deliberately far future — a client recompute would read this as CURRENT.
          expiresAt: '2099-01-01T00:00:00Z',
        },
      ],
      isLoading: false,
    });

    render(<MhdTrainingComplianceBoard companyId="company-1" />);

    expect(screen.getByText('Expired')).toBeInTheDocument();
    // The tell-tale of a client recompute would be a CURRENT badge; it must be absent.
    expect(screen.queryByText('Current')).not.toBeInTheDocument();
    expect(screen.getByText('Dana Doe')).toBeInTheDocument();
  });
});
