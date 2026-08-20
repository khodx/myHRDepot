import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const { mockUseMhdAuth, mockUseMhdMemorandums, mockUseMhdMemorandumPeople, mockUseMhdMemorandumDeliveries } = vi.hoisted(() => ({
  mockUseMhdAuth: vi.fn(),
  mockUseMhdMemorandums: vi.fn(),
  mockUseMhdMemorandumPeople: vi.fn(),
  mockUseMhdMemorandumDeliveries: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

vi.mock('../Hook', () => ({
  useMhdMemorandums: (...args: unknown[]) => mockUseMhdMemorandums(...args),
  useMhdMemorandumPeople: (...args: unknown[]) => mockUseMhdMemorandumPeople(...args),
  useMhdMemorandumDeliveries: (...args: unknown[]) => mockUseMhdMemorandumDeliveries(...args),
  useMhdCreateMemorandum: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useMhdPublishMemorandum: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

const { MhdMemorandumsPage } = await import('../components/MhdMemorandumsPage');

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({
    profile: { companyId: 'company-1' },
    roles,
  });
}

const memoRow = {
  id: 'memo-1',
  referenceId: 'MEMO-001',
  title: 'Office Closure',
  category: 'FACILITIES' as const,
  requiresAcknowledgment: false,
  status: 'DRAFT' as const,
  audienceLabel: null,
  publishedAt: null,
  createdAt: '2026-08-18T00:00:00.000Z',
  recipientCount: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMhdMemorandums.mockReturnValue({ data: [memoRow], isLoading: false });
  mockUseMhdMemorandumPeople.mockReturnValue({ data: [], isLoading: false });
  mockUseMhdMemorandumDeliveries.mockReturnValue({ data: [], isLoading: false });
});

describe('MhdMemorandumsPage role gating', () => {
  it('hides the New Memorandum and Publish affordances for a Client User', () => {
    mockAuth(['Client User']);

    render(
      <MemoryRouter>
        <MhdMemorandumsPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('New Memorandum')).not.toBeInTheDocument();
    expect(screen.queryByText('Publish')).not.toBeInTheDocument();
    expect(screen.getByText('Office Closure')).toBeInTheDocument();
  });

  it('shows the New Memorandum and Publish affordances for HR Partner', () => {
    mockAuth(['HR Partner']);

    render(
      <MemoryRouter>
        <MhdMemorandumsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('New Memorandum')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });
});
