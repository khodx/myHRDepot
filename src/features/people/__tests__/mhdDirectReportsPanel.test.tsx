import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseMhdDirectReports } = vi.hoisted(() => ({
  mockUseMhdDirectReports: vi.fn(),
}));

vi.mock('@/features/people/Hook', () => ({
  useMhdDirectReports: (...args: unknown[]) => mockUseMhdDirectReports(...args),
}));

const { MhdDirectReportsPanel } = await import('../components/MhdDirectReportsPanel');

function renderPanel() {
  return render(
    <MemoryRouter>
      <MhdDirectReportsPanel personId="person-1" />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMhdDirectReports.mockReturnValue({
    data: [
      {
        personId: 'person-2',
        referenceId: 'PERS-000002',
        displayName: 'Robin Report',
        jobTitle: 'HR Generalist',
      },
      {
        personId: 'person-3',
        referenceId: 'PERS-000003',
        displayName: 'Casey Report',
        jobTitle: null,
      },
    ],
    isLoading: false,
    error: null,
  });
});

describe('MhdDirectReportsPanel', () => {
  it('renders reports as links and shows job titles when present', () => {
    renderPanel();

    expect(screen.getByRole('link', { name: 'Robin Report' })).toHaveAttribute(
      'href',
      '/people/person-2',
    );
    expect(screen.getByRole('link', { name: 'Casey Report' })).toHaveAttribute(
      'href',
      '/people/person-3',
    );
    expect(screen.getByText(/HR Generalist/)).toBeInTheDocument();
  });

  it('shows the empty result message', () => {
    mockUseMhdDirectReports.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderPanel();

    expect(screen.getByText('No direct reports.')).toBeInTheDocument();
  });

  it('shows the loading message', () => {
    mockUseMhdDirectReports.mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    renderPanel();

    expect(screen.getByText('Loading direct reports...')).toBeInTheDocument();
  });

  it('shows the error message', () => {
    mockUseMhdDirectReports.mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error('Unable to load direct reports: permission denied'),
    });

    renderPanel();

    expect(screen.getByText('Unable to load direct reports: permission denied')).toBeInTheDocument();
  });
});
