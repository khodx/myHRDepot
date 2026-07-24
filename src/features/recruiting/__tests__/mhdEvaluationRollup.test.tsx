import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRollup, mockScore, mockEvaluation, mockFinalize } = vi.hoisted(() => ({
  mockRollup: vi.fn(),
  mockScore: vi.fn(),
  mockEvaluation: vi.fn(),
  mockFinalize: vi.fn(),
}));

// Mock the interviews-package hooks so the panel receives canned server results.
// The whole point of this test is that the panel RENDERS the server-derived score
// (mhd_interview_evaluation_overall_score) verbatim and never recomputes it from
// the rollup rows on the client.
vi.mock('../interviews/Hook', () => ({
  useMhdInterviewEvaluationRollup: () => mockRollup(),
  useMhdInterviewEvaluationScore: () => mockScore(),
  useMhdInterviewEvaluation: () => mockEvaluation(),
  useMhdFinalizeEvaluation: () => mockFinalize(),
}));

const { MhdCandidateEvaluationPanel } =
  await import('../interviews/components/MhdCandidateEvaluationPanel');

describe('MhdCandidateEvaluationPanel — renders the SERVER-derived weighted score', () => {
  beforeEach(() => {
    mockRollup.mockReset();
    mockScore.mockReset();
    mockEvaluation.mockReset();
    mockFinalize.mockReset();
    mockEvaluation.mockReturnValue({ data: null, isLoading: false, isError: false });
    mockFinalize.mockReturnValue({ mutateAsync: vi.fn(), isPending: false, isError: false });
  });

  it('shows the server overall score exactly, not any client recompute of the rollup', () => {
    // Rollup the server hands us. A naive client recompute would produce:
    //   weighted   = (3*4.6 + 1*1.4) / (3+1) = 3.80
    //   unweighted = (4.6 + 1.4) / 2         = 3.00
    // The SERVER score is deliberately 4.20 — equal to NEITHER — so if the panel
    // rendered a recompute this assertion would fail.
    mockRollup.mockReturnValue({
      data: [
        {
          competencyId: 'c-lead',
          competencyName: 'Leadership',
          weight: 3,
          avgRating: 4.6,
          responseCount: 2,
        },
        {
          competencyId: 'c-comm',
          competencyName: 'Communication',
          weight: 1,
          avgRating: 1.4,
          responseCount: 1,
        },
      ],
      isLoading: false,
      isError: false,
    });
    mockScore.mockReturnValue({ data: 4.2, isLoading: false, isError: false });

    render(<MhdCandidateEvaluationPanel applicationId="app-1" canFinalize={false} />);

    // The prominent overall score is the server value, formatted to 2 dp, out of 5.
    expect(screen.getByText('4.20')).toBeInTheDocument();
    expect(screen.getByText(/\/ 5/)).toBeInTheDocument();

    // A client recompute (weighted 3.80 or unweighted 3.00) must NOT appear anywhere.
    expect(screen.queryByText('3.80')).not.toBeInTheDocument();
    expect(screen.queryByText('3.00')).not.toBeInTheDocument();

    // The per-competency rollup rows are the server rows, rendered verbatim.
    expect(screen.getByText('Leadership')).toBeInTheDocument();
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('4.60')).toBeInTheDocument();
    expect(screen.getByText('1.40')).toBeInTheDocument();
  });

  it('shows the "no rated responses yet" state when the server score is null', () => {
    mockRollup.mockReturnValue({ data: [], isLoading: false, isError: false });
    mockScore.mockReturnValue({ data: null, isLoading: false, isError: false });

    render(<MhdCandidateEvaluationPanel applicationId="app-1" canFinalize={false} />);

    expect(screen.getByText(/No rated responses yet/i)).toBeInTheDocument();
  });
});
