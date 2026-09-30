import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import { MhdAssistantProvider } from '../AssistantContext';
import { useMhdAssistant } from '../assistantContextValue';

const { mockUseMhdAuth } = vi.hoisted(() => ({ mockUseMhdAuth: vi.fn() }));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

function mockAuth(roles: MhdAuthRoleName[] = ['HR Partner']) {
  mockUseMhdAuth.mockReturnValue({ roles });
}

function AssistantOpener() {
  const { openAssistant } = useMhdAssistant();

  return <button onClick={() => openAssistant('leaves')}>Open with leaves</button>;
}

function renderAssistant(children?: ReactNode) {
  return render(
    <MemoryRouter>
      <MhdAssistantProvider>{children}</MhdAssistantProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth();
});

describe('MhdAssistantProvider', () => {
  it('renders the floating button and opens the assistant modal', async () => {
    const user = userEvent.setup();
    renderAssistant();

    await user.click(screen.getByRole('button', { name: 'Open navigation assistant' }));

    expect(screen.getByRole('dialog', { name: 'Find something' })).toBeInTheDocument();
  });

  it('shows an empty state for a query with no match', async () => {
    const user = userEvent.setup();
    renderAssistant();
    await user.click(screen.getByRole('button', { name: 'Open navigation assistant' }));

    await user.type(screen.getByPlaceholderText('What are you looking for?'), 'zzzz-no-navigation-match');

    expect(screen.getByText('No matches — try different words.')).toBeInTheDocument();
  });

  it('opens with an initial query from a child using the hook', async () => {
    const user = userEvent.setup();
    renderAssistant(<AssistantOpener />);

    await user.click(screen.getByRole('button', { name: 'Open with leaves' }));

    expect(screen.getByRole('dialog', { name: 'Find something' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What are you looking for?')).toHaveValue('leaves');
    expect(screen.getByRole('link', { name: /Leaves/i })).toHaveAttribute('href', '/leaves');
  });
});
