import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock, acknowledgmentsRef, acknowledgeMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  acknowledgmentsRef: { current: [] as unknown[] },
  acknowledgeMock: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: rpcMock },
}));

vi.mock('../Hook', () => ({
  useMhdMyPolicyAcknowledgments: () => ({ data: acknowledgmentsRef.current, isLoading: false }),
  useMhdAcknowledgePolicy: () => ({ mutateAsync: acknowledgeMock, isPending: false }),
}));

const { mhdPoliciesService } = await import('../Service');
const { MhdMyPoliciesPage } = await import('../components/MhdMyPoliciesPage');

beforeEach(() => {
  vi.clearAllMocks();
  acknowledgmentsRef.current = [];
});

describe('mhdPoliciesService', () => {
  it('creates and publishes policies with the exact RPC argument names', async () => {
    rpcMock
      .mockResolvedValueOnce({ data: [{ id: 'pol-1' }], error: null })
      .mockResolvedValueOnce({ data: [{ id: 'ver-1' }], error: null });

    await mhdPoliciesService.createPolicy({
      companyId: 'company-1',
      title: 'Remote Work',
      category: 'WORKPLACE_CONDUCT',
      jurisdiction: 'CA',
    });
    await mhdPoliciesService.publishVersion({
      policyId: 'pol-1',
      content: 'Policy body',
      requiresSignature: true,
    });

    expect(rpcMock).toHaveBeenNthCalledWith(1, 'mhd_create_policy', expect.any(Object));
    expect(rpcMock).toHaveBeenNthCalledWith(2, 'mhd_publish_policy_version', {
      p_policy_id: 'pol-1',
      p_content: 'Policy body',
      p_requires_signature: true,
    });
  });

  it('maps my policy acknowledgments', async () => {
    rpcMock.mockResolvedValueOnce({
      data: [
        {
          id: 'ack-1',
          reference_id: 'POLA-1',
          policy_title: 'Remote Work',
          policy_version_id: 'ver-1',
          status: 'PENDING',
          assigned_at: '2026-08-01T00:00:00Z',
          signed_at: null,
        },
      ],
      error: null,
    });

    const [ack] = await mhdPoliciesService.myAcknowledgments();
    expect(rpcMock).toHaveBeenCalledWith('mhd_my_policy_acknowledgments', undefined);
    expect(ack.policyTitle).toBe('Remote Work');
    expect(ack.status).toBe('PENDING');
  });
});

describe('MhdMyPoliciesPage', () => {
  it('requires explicit confirmation before acknowledging a pending policy', () => {
    acknowledgmentsRef.current = [
      {
        id: 'ack-1',
        referenceId: 'POLA-1',
        policyTitle: 'Remote Work',
        policyVersionId: 'ver-1',
        status: 'PENDING',
        assignedAt: '2026-08-01T00:00:00Z',
        signedAt: null,
      },
    ];

    render(<MhdMyPoliciesPage />);

    expect(screen.getByText('Remote Work')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acknowledge' })).toBeDisabled();
    fireEvent.click(screen.getByLabelText('I acknowledge this policy.'));
    fireEvent.click(screen.getByRole('button', { name: 'Acknowledge' }));

    expect(acknowledgeMock).toHaveBeenCalledWith({
      acknowledgmentId: 'ack-1',
      esignatureRequestId: null,
    });
  });
});
