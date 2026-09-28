import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';

const { mockUseMhdAuth } = vi.hoisted(() => ({ mockUseMhdAuth: vi.fn() }));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

const { MhdAssistantLauncher } = await import('../MhdAssistantLauncher');

function mockAuth(roles: MhdAuthRoleName[] = ['HR Partner']) {
  mockUseMhdAuth.mockReturnValue({ roles });
}

function renderLauncher() {
  return render(
    <MemoryRouter>
      <MhdAssistantLauncher />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth();
});

describe('MhdAssistantLauncher', () => {
  it('renders the launcher button', () => {
    renderLauncher();

    expect(screen.getByRole('button', { name: 'Open navigation assistant' })).toBeInTheDocument();
  });

  it('opens the modal when the launcher is clicked', () => {
    renderLauncher();

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation assistant' }));

    expect(screen.getByRole('dialog', { name: 'Find something' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What are you looking for?')).toHaveFocus();
  });

  it('renders a matching navigation result as a link', () => {
    renderLauncher();
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation assistant' }));

    fireEvent.change(screen.getByPlaceholderText('What are you looking for?'), {
      target: { value: 'leaves' },
    });

    expect(screen.getByRole('link', { name: /Leaves Manage leave of absence cases and balances/i })).toHaveAttribute(
      'href',
      '/leaves',
    );
  });

  it('shows the empty state when there are no matches', () => {
    renderLauncher();
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation assistant' }));

    fireEvent.change(screen.getByPlaceholderText('What are you looking for?'), {
      target: { value: 'zzzz-no-navigation-match' },
    });

    expect(screen.getByText('No matches — try different words.')).toBeInTheDocument();
  });

  it('closes the modal after clicking a result', () => {
    renderLauncher();
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation assistant' }));
    fireEvent.change(screen.getByPlaceholderText('What are you looking for?'), {
      target: { value: 'leaves' },
    });

    fireEvent.click(screen.getByRole('link', { name: /Leaves Manage leave of absence cases and balances/i }));

    expect(screen.queryByRole('dialog', { name: 'Find something' })).not.toBeInTheDocument();
  });
});
