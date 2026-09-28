import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { MhdAssistantProvider } from '@/features/assistant/Hook';
import { MhdDashboardAssistantCallout } from '../MhdDashboardAssistantCallout';

const { mockUseMhdAuth } = vi.hoisted(() => ({ mockUseMhdAuth: vi.fn() }));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

function mockAuth(roles: MhdAuthRoleName[] = ['HR Partner']) {
  mockUseMhdAuth.mockReturnValue({ roles });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth();
});

describe('MhdDashboardAssistantCallout', () => {
  it('opens the assistant modal', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MhdAssistantProvider>
          <MhdDashboardAssistantCallout />
        </MhdAssistantProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Ask the assistant' }));

    expect(screen.getByRole('dialog', { name: 'Find something' })).toBeInTheDocument();
  });
});
