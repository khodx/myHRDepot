import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mhdOfferFormSchema } from '../offers/Schemas';
import { MHD_OFFER_PAY_FREQUENCIES } from '../offers/Types';

const { rpcMock } = vi.hoisted(() => ({ rpcMock: vi.fn() }));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

const { mhdOfferService } = await import('../offers/Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdOfferService.createOffer', () => {
  it('sends the pay terms and the override reason, and nothing about who is acting', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'offer-1', reference_id: 'A1B-2-3C4D-5-E6' }],
      error: null,
    });

    await mhdOfferService.createOffer({
      applicationId: 'application-1',
      jobTitle: 'Field Service Technician',
      baseSalary: 24,
      payFrequency: 'HOURLY',
      salaryOverrideReason: '  Apprenticeship rate approved by the owner.  ',
    });

    expect(rpcMock).toHaveBeenCalledWith(
      'mhd_recruiting_offer_create',
      expect.objectContaining({
        p_application_id: 'application-1',
        p_base_salary: 24,
        p_pay_frequency: 'HOURLY',
        p_salary_override_reason: 'Apprenticeship rate approved by the owner.',
      }),
    );
    expect(rpcMock.mock.calls[0]?.[1]).not.toHaveProperty('p_actor_user_id');
  });

  it('leaves the override reason out when there is none', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ id: 'offer-1', reference_id: 'A1B-2-3C4D-5-E6' }],
      error: null,
    });
    await mhdOfferService.createOffer({
      applicationId: 'application-1',
      jobTitle: 'Analyst',
      salaryOverrideReason: '',
    });
    expect(rpcMock.mock.calls[0]?.[1].p_salary_override_reason).toBeUndefined();
  });

  it("surfaces the server's pay-check refusal", async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: new Error(
        'The offered pay fails a classification check: below the California minimum wage',
      ),
    });
    await expect(
      mhdOfferService.createOffer({
        applicationId: 'application-1',
        jobTitle: 'Analyst',
        baseSalary: 10,
        payFrequency: 'HOURLY',
      }),
    ).rejects.toThrow(/classification check/);
  });
});

describe('mhdOfferFormSchema pay frequency', () => {
  const base = {
    applicationId: 'application-1',
    jobTitle: 'Analyst',
    baseSalary: '',
    requiresApproval: false,
  };

  it.each([...MHD_OFFER_PAY_FREQUENCIES, ''])('accepts %j', (payFrequency) => {
    expect(mhdOfferFormSchema.safeParse({ ...base, payFrequency }).success).toBe(true);
  });

  it('refuses free text the pay check cannot annualize', () => {
    expect(mhdOfferFormSchema.safeParse({ ...base, payFrequency: 'fortnightly' }).success).toBe(
      false,
    );
  });
});
