import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdOfferService } = await import('../offers/Service');

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * THE HIRE HANDOFF. `acceptOffer` calls the single `mhd_recruiting_offer_accept`
 * RPC, which (server-side) property-gates on the completed signature, creates the
 * `job_assignment` (applicant -> employee), marks the offer ACCEPTED with that id,
 * and marks the parent application HIRED. The service must forward the offer id and
 * the app-layer signature-request soft link, and surface the created
 * `job_assignment_id` — never invent a Doc-Gen/E-Sign RPC or pre-empt the gate.
 */
describe('mhdOfferService.acceptOffer — the hire handoff', () => {
  it('calls the accept RPC and returns the created job_assignment id (application marked HIRED server-side)', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          offer_id: 'offer-1',
          job_assignment_id: 'ja-1',
          onboarding_offer_letter_id: 'ool-1',
          onboarding_candidate_evaluation_id: 'oce-1',
        },
      ],
      error: null,
    });

    const result = await mhdOfferService.acceptOffer({
      offerId: 'offer-1',
      esignatureRequestId: 'sig-1',
    });

    // Exactly the handoff RPC, with the offer id and the injected signature soft link.
    expect(rpcMock).toHaveBeenCalledWith('mhd_recruiting_offer_accept', {
      p_offer_id: 'offer-1',
      p_esignature_request_id: 'sig-1',
    });
    // The handoff created a job assignment (person -> employee) and seeded the
    // onboarding feed records; the service surfaces those ids.
    expect(result.jobAssignmentId).toBe('ja-1');
    expect(result.offerId).toBe('offer-1');
    expect(result.onboardingOfferLetterId).toBe('ool-1');
    expect(result.onboardingCandidateEvaluationId).toBe('oce-1');
  });

  it('omits the signature soft link when none is provided (server enforces the gate)', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          offer_id: 'offer-2',
          job_assignment_id: 'ja-2',
          onboarding_offer_letter_id: 'ool-2',
          onboarding_candidate_evaluation_id: 'oce-2',
        },
      ],
      error: null,
    });

    await mhdOfferService.acceptOffer({ offerId: 'offer-2' });

    expect(rpcMock).toHaveBeenCalledWith('mhd_recruiting_offer_accept', {
      p_offer_id: 'offer-2',
      p_esignature_request_id: undefined,
    });
  });

  it('surfaces the server signature-gate error rather than pre-empting it', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'signature not yet complete' },
    });

    await expect(mhdOfferService.acceptOffer({ offerId: 'offer-3' })).rejects.toMatchObject({
      message: 'signature not yet complete',
    });
  });
});
