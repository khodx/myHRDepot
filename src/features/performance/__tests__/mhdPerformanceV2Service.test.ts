import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mhdFeedbackReleaseState,
  mhdOutstandingParticipants,
  type MhdFeedbackAggregateGroup,
  type MhdReviewParticipant,
} from '../Types-v2';

// The v2 service binds `supabaseClient.rpc` at module load
// (`supabaseClient.rpc.bind(supabaseClient)`), so the mock must be in place
// before the dynamic import below. Every v2 read goes through a single RPC — no
// direct table selects — which is itself part of the anonymity guarantee.
const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn<(name: string, args?: unknown) => unknown>() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdPerformanceV2Service } = await import('../Service-v2');

function rpcArgsFor(name: string): Record<string, unknown> | undefined {
  const call = rpcMock.mock.calls.find(([fnName]) => fnName === name);
  return call?.[1] as Record<string, unknown> | undefined;
}

beforeEach(() => {
  vi.clearAllMocks();
  rpcMock.mockReset();
});

// ---------------------------------------------------------------------------
// (a) Anonymity — the reviewer (or anyone) receives ZERO individual peer rows.
//
// Anonymity is enforced in RLS (`performance_feedback_author_only`); the client
// contract's job is to offer no path around it. This asserts the service exposes
// no reader for an individual PEER/UPWARD response, and that the one sanctioned
// route — the aggregate — carries no author identity.
// ---------------------------------------------------------------------------

describe('mhdPerformanceV2Service — 360 anonymity', () => {
  it('exposes no service method that reads an individual peer or upward response', () => {
    const methodNames = Object.keys(mhdPerformanceV2Service);
    expect(methodNames).not.toContain('listFeedbackResponses');
    expect(methodNames).not.toContain('getParticipantResponse');
    expect(methodNames).not.toContain('getFeedbackResponse');
    // No method name so much as hints at reading raw responses — a named read is
    // an invitation for a component to go looking for the data behind it.
    expect(methodNames.some((name) => /response/i.test(name))).toBe(false);
  });

  it('returns only anonymised aggregate groups from the feedback aggregate — never an author', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          participant_type: 'PEER',
          competency_id: 'comp-1',
          competency_name: 'Teamwork',
          section_id: null,
          section_title: null,
          response_count: 3,
          mean_rating: 4.5,
          comments: ['Great collaborator'],
        },
      ],
      error: null,
    });

    const groups = await mhdPerformanceV2Service.feedbackAggregate('review-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_performance_feedback_aggregate', { p_review_id: 'review-1' });
    expect(groups).toHaveLength(1);
    const [group] = groups;
    expect(group.participantType).toBe('PEER');
    expect(group.responseCount).toBe(3);
    // The shape carries no per-author identity of any kind.
    const keys = Object.keys(group);
    expect(keys).not.toContain('personId');
    expect(keys).not.toContain('author');
    expect(keys).not.toContain('respondentId');
    expect(keys).not.toContain('userId');
  });
});

// ---------------------------------------------------------------------------
// (b) Threshold — the aggregate is EMPTY below the floor and POPULATED above it.
//
// Below threshold the RPC returns no rows at all (not zeros, not a count with
// null ratings). The UI must then say "not enough responses to release" rather
// than render an empty section — mhdFeedbackReleaseState is what tells the two
// empty states apart.
// ---------------------------------------------------------------------------

describe('mhdPerformanceV2Service — threshold gating', () => {
  it('yields an empty aggregate below the floor and a populated one above it', async () => {
    // Below the floor: the SECURITY DEFINER function releases nothing.
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    const below = await mhdPerformanceV2Service.feedbackAggregate('review-1');
    expect(below).toEqual([]);

    // Above the floor: the group is released with count, mean and comments.
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          participant_type: 'PEER',
          competency_id: 'comp-1',
          competency_name: 'Teamwork',
          section_id: null,
          section_title: null,
          response_count: 3,
          mean_rating: 4,
          comments: ['ok'],
        },
      ],
      error: null,
    });
    const above = await mhdPerformanceV2Service.feedbackAggregate('review-1');
    expect(above).toHaveLength(1);
    expect(above[0].responseCount).toBe(3);
    expect(above[0].meanRating).toBe(4);
  });

  it('distinguishes WITHHELD (invited, below threshold) from RELEASED and NOT_INVITED', () => {
    const invitedPeers: MhdReviewParticipant[] = [
      { id: 'p1', personId: 'x1', personDisplayName: 'X1', participantType: 'PEER', status: 'RESPONDED', respondedAt: null },
      { id: 'p2', personId: 'x2', personDisplayName: 'X2', participantType: 'PEER', status: 'INVITED', respondedAt: null },
    ];
    const releasedGroups: MhdFeedbackAggregateGroup[] = [
      {
        participantType: 'PEER',
        competencyId: 'comp-1',
        competencyName: 'Teamwork',
        sectionId: null,
        sectionTitle: null,
        responseCount: 3,
        meanRating: 4,
        comments: [],
        commentsReleased: true,
      },
    ];

    // Peers were asked but no group came back → the platform is withholding. The
    // panel must SAY so, never render an empty section.
    expect(mhdFeedbackReleaseState('PEER', [], invitedPeers)).toBe('WITHHELD');
    // A group is present → threshold met.
    expect(mhdFeedbackReleaseState('PEER', releasedGroups, invitedPeers)).toBe('RELEASED');
    // Nobody of this type was ever asked → nothing to show, nothing to explain.
    expect(mhdFeedbackReleaseState('PEER', [], [])).toBe('NOT_INVITED');
  });
});

// ---------------------------------------------------------------------------
// (c) Inherited competency — cannot be removed from a review.
//
// Removal is refused by the database (trg_performance_competency_no_remove, 42501).
// The client contract mirrors that by offering NO removal path at all, and by
// preserving `is_inherited` so the UI can withhold the delete control rather
// than letting the database refuse the click.
// ---------------------------------------------------------------------------

describe('mhdPerformanceV2Service — inherited competencies', () => {
  it('offers no method that removes a competency from a review', () => {
    const methodNames = Object.keys(mhdPerformanceV2Service);
    expect(methodNames).not.toContain('removeReviewCompetency');
    expect(methodNames).not.toContain('deleteReviewCompetency');
    expect(methodNames.some((name) => /remove|delete/i.test(name))).toBe(false);
  });

  it('preserves the inherited flag so the UI can withhold the delete control', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'rc-1',
          competency_id: 'comp-1',
          competency_name: 'Workplace Safety',
          category: 'Core',
          is_regulated: true,
          is_inherited: true,
          rating: null,
          comments: null,
        },
        {
          id: 'rc-2',
          competency_id: 'comp-2',
          competency_name: 'Extra',
          category: null,
          is_regulated: false,
          is_inherited: false,
          rating: 4,
          comments: null,
        },
      ],
      error: null,
    });

    const rows = await mhdPerformanceV2Service.listReviewCompetencies('review-1');
    expect(rows[0].isInherited).toBe(true);
    expect(rows[0].isRegulated).toBe(true);
    expect(rows[1].isInherited).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// (d) Nomination vs invitation — the SERVER decides which, from who is calling.
//
// The invite call carries no status field: the subject may only NOMINATE (needs
// approval), the reviewer/HR INVITE directly. A client-supplied status would let
// the subject hand-pick their own raters — the exact upward bias the approval
// step exists to catch.
// ---------------------------------------------------------------------------

describe('mhdPerformanceV2Service — nomination vs invitation', () => {
  it('sends no status when inviting — the server decides INVITED vs NOMINATED', async () => {
    rpcMock.mockResolvedValueOnce({ data: 'participant-1', error: null });

    const id = await mhdPerformanceV2Service.inviteParticipant({
      reviewId: 'review-1',
      personId: 'person-9',
      participantType: 'PEER',
    });

    expect(id).toBe('participant-1');
    const args = rpcArgsFor('mhd_performance_invite_participant');
    expect(args).toEqual({ p_review_id: 'review-1', p_person_id: 'person-9', p_participant_type: 'PEER' });
    expect(args).not.toHaveProperty('p_status');
  });

  it('has an approve path that turns a nomination into an invitation', async () => {
    rpcMock.mockResolvedValueOnce({ error: null });

    await mhdPerformanceV2Service.approveParticipant('participant-1');

    expect(rpcMock).toHaveBeenCalledWith('mhd_performance_approve_participant', {
      p_participant_id: 'participant-1',
    });
  });

  it('counts both NOMINATED and INVITED as outstanding, and neither RESPONDED nor DECLINED', () => {
    const participants: MhdReviewParticipant[] = [
      { id: 'p1', personId: 'x1', personDisplayName: 'Nominee', participantType: 'PEER', status: 'NOMINATED', respondedAt: null },
      { id: 'p2', personId: 'x2', personDisplayName: 'Invitee', participantType: 'PEER', status: 'INVITED', respondedAt: null },
      { id: 'p3', personId: 'x3', personDisplayName: 'Answered', participantType: 'PEER', status: 'RESPONDED', respondedAt: '2026-07-20' },
      { id: 'p4', personId: 'x4', personDisplayName: 'Declined', participantType: 'UPWARD', status: 'DECLINED', respondedAt: null },
    ];

    const outstanding = mhdOutstandingParticipants(participants);
    expect(outstanding.map((p) => p.id)).toEqual(['p1', 'p2']);
  });
});
