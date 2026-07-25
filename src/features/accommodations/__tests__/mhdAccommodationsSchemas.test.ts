import { describe, expect, it } from 'vitest';
import {
  mhdAccommodationDecisionBlockers,
  mhdAccommodationInteractionSchema,
  mhdAccommodationMedicalSchema,
  mhdAccommodationRequestSchema,
} from '../Schemas';

const PERSON = '11111111-1111-4111-8111-111111111111';

function request(overrides: Record<string, unknown> = {}) {
  return {
    personId: PERSON,
    requestSource: 'SELF',
    requestChannel: 'VERBAL',
    requestedAt: '2026-07-25T17:00:00.000Z',
    requestSummary: 'Needs a seated workstation and a later shift start.',
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Intake — a request may be verbal and needs no special wording       */
/* ------------------------------------------------------------------ */

describe('mhdAccommodationRequestSchema — intake never requires a form or magic words', () => {
  it('accepts a VERBAL request that never uses the words "reasonable accommodation"', () => {
    const parsed = mhdAccommodationRequestSchema.safeParse(
      request({
        requestChannel: 'VERBAL',
        requestSummary: 'I am having a hard time standing for my whole shift.',
      }),
    );
    expect(parsed.success).toBe(true);
  });

  it.each(['VERBAL', 'WRITTEN', 'EMAIL', 'PHONE', 'PORTAL', 'OBSERVED', 'OTHER'])(
    'accepts an intake arriving over the %s channel',
    (channel) => {
      expect(
        mhdAccommodationRequestSchema.safeParse(request({ requestChannel: channel })).success,
      ).toBe(true);
    },
  );

  it.each([
    'SELF',
    'REPRESENTATIVE',
    'EMPLOYER_OBSERVED',
    'LEAVE_EXHAUSTION',
    'RETURN_TO_WORK',
    'APPLICANT',
    'OTHER',
  ])('accepts a %s request source', (source) => {
    expect(
      mhdAccommodationRequestSchema.safeParse(request({ requestSource: source })).success,
    ).toBe(true);
  });

  it('still requires SOMETHING to be described — an empty request is not a request', () => {
    expect(
      mhdAccommodationRequestSchema.safeParse(request({ requestSummary: '   ' })).success,
    ).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Prohibited medical detail                                           */
/* ------------------------------------------------------------------ */

const PROHIBITED = [
  'Her diagnosis is multiple sclerosis.',
  'The employee was diagnosed last spring.',
  'Please attach the complete medical records.',
  'The limitation is caused by a workplace injury.',
  'The family genetic information is relevant here.',
];

describe('prohibited medical detail is rejected wherever free text is accepted', () => {
  it.each(PROHIBITED)('intake rejects %j', (text) => {
    const parsed = mhdAccommodationRequestSchema.safeParse(request({ requestSummary: text }));
    expect(parsed.success).toBe(false);
  });

  it.each(PROHIBITED)('interactive-process notes reject %j', (text) => {
    expect(mhdAccommodationInteractionSchema.safeParse({ summary: text }).success).toBe(false);
  });

  it.each(PROHIBITED)(
    'the restricted medical record rejects %j as a functional limitation',
    (text) => {
      const parsed = mhdAccommodationMedicalSchema.safeParse({
        documentationType: 'SIMPLE_CERTIFICATION',
        status: 'RECEIVED',
        needIsObvious: false,
        documentationRequested: false,
        functionalLimitation: text,
      });
      expect(parsed.success).toBe(false);
    },
  );

  it('accepts a genuine functional limitation and accommodation need', () => {
    const parsed = mhdAccommodationMedicalSchema.safeParse({
      documentationType: 'PROVIDER_NOTE',
      status: 'SUFFICIENT',
      needIsObvious: false,
      documentationRequested: false,
      functionalLimitation: 'Cannot stand for more than 20 minutes at a time.',
      accommodationNeed: 'A seated workstation and a five-minute break each hour.',
    });
    expect(parsed.success).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Obvious need — documentation cannot be requested                    */
/* ------------------------------------------------------------------ */

describe('mhdAccommodationMedicalSchema — obvious need prohibits a documentation request', () => {
  it('rejects requesting documentation when the need is recorded as obvious', () => {
    const parsed = mhdAccommodationMedicalSchema.safeParse({
      documentationType: 'SIMPLE_CERTIFICATION',
      status: 'REQUESTED',
      needIsObvious: true,
      documentationRequested: true,
      requestedAt: '2026-07-25',
    });
    expect(parsed.success).toBe(false);
    expect(parsed.success ? [] : parsed.error.issues.map((issue) => issue.message)).toContain(
      'Medical documentation cannot be requested when the disability and the need for accommodation are obvious.',
    );
  });

  it('accepts an obvious need recorded WITHOUT a documentation request', () => {
    const parsed = mhdAccommodationMedicalSchema.safeParse({
      documentationType: 'OTHER',
      status: 'NOT_NEEDED',
      needIsObvious: true,
      documentationRequested: false,
      accommodationNeed: 'A ground-floor workspace.',
    });
    expect(parsed.success).toBe(true);
  });

  it('requires a requested-on date whenever documentation IS requested', () => {
    const parsed = mhdAccommodationMedicalSchema.safeParse({
      documentationType: 'SIMPLE_CERTIFICATION',
      status: 'REQUESTED',
      needIsObvious: false,
      documentationRequested: true,
      requestedAt: null,
    });
    expect(parsed.success).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* The decision gate                                                   */
/* ------------------------------------------------------------------ */

const READY = {
  outcome: 'APPROVED' as const,
  selectedOptionId: 'option-1',
  interactionCount: 1,
  optionCount: 1,
};

describe('mhdAccommodationDecisionBlockers — no decision without a real process', () => {
  it('clears when the process happened, an option exists, and one is selected', () => {
    expect(mhdAccommodationDecisionBlockers(READY)).toEqual([]);
  });

  it('blocks a decision before any interactive-process interaction is recorded', () => {
    expect(mhdAccommodationDecisionBlockers({ ...READY, interactionCount: 0 })).toContain(
      'Record at least one interactive-process interaction before deciding.',
    );
  });

  it('blocks a decision before any option has been evaluated', () => {
    expect(mhdAccommodationDecisionBlockers({ ...READY, optionCount: 0 })).toContain(
      'Evaluate at least one accommodation option before deciding.',
    );
  });

  it('blocks a grant that names no option', () => {
    expect(mhdAccommodationDecisionBlockers({ ...READY, selectedOptionId: null })).toContain(
      'Select the accommodation option being granted.',
    );
  });

  it('blocks selecting an option that removes an essential function', () => {
    // Removing an essential function is not a reasonable accommodation;
    // mhd_accommodation_decide raises 23514 on the same condition.
    expect(
      mhdAccommodationDecisionBlockers({
        ...READY,
        selectedOptionRemovesEssentialFunction: true,
      }),
    ).toContain('An option that removes an essential function cannot be selected.');
  });

  it('blocks a denial that carries no individualized analysis', () => {
    expect(
      mhdAccommodationDecisionBlockers({
        outcome: 'DENIED',
        interactionCount: 2,
        optionCount: 3,
        individualizedAnalysis: '   ',
      }),
    ).toContain(
      'A denial requires an individualized analysis recording the alternatives that were evaluated.',
    );
  });

  it('clears a denial once the individualized analysis is recorded', () => {
    expect(
      mhdAccommodationDecisionBlockers({
        outcome: 'DENIED',
        interactionCount: 2,
        optionCount: 3,
        individualizedAnalysis:
          'Remote work, a modified schedule and reassignment were each costed and evaluated against the essential functions.',
      }),
    ).toEqual([]);
  });

  it('does not demand a selected option for a denial', () => {
    const blockers = mhdAccommodationDecisionBlockers({
      outcome: 'DENIED',
      interactionCount: 1,
      optionCount: 1,
      individualizedAnalysis: 'Each alternative was evaluated and costed.',
      selectedOptionId: null,
    });
    expect(blockers).toEqual([]);
  });
});
