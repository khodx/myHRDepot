import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdCalendarEvent } from '../Types';

const { mockUseMhdAuth, mockUseMhdCalendarEvents, mockUseMhdCompanies, mockUseMhdPeoplePicker } =
  vi.hoisted(() => ({
    mockUseMhdAuth: vi.fn(),
    mockUseMhdCalendarEvents: vi.fn(),
    mockUseMhdCompanies: vi.fn(),
    mockUseMhdPeoplePicker: vi.fn(),
  }));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

vi.mock('@/features/companies/Hook', () => ({
  useMhdCompanies: (...args: unknown[]) => mockUseMhdCompanies(...args),
}));

vi.mock('@/features/people/Hook', () => ({
  useMhdPeoplePicker: (...args: unknown[]) => mockUseMhdPeoplePicker(...args),
}));

vi.mock('../Hook', () => ({
  useMhdCalendarEvents: (...args: unknown[]) => mockUseMhdCalendarEvents(...args),
}));

const { MhdCalendarPage } = await import('../components/MhdCalendarPage');

const baseEvent: MhdCalendarEvent = {
  eventId: 'calendar-event-1',
  sourceType: 'TASK',
  sourceId: 'task-1',
  title: 'Finalize onboarding packet',
  eventDate: new Date().toISOString().slice(0, 10),
  eventEnd: null,
  personId: 'person-1',
  personName: 'Pat Person',
  status: 'OPEN',
  companyId: 'company-1',
  linkPath: '/tasks/task-1',
};

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    userEmail: 'user@myhrdepot.com',
    authUserId: 'auth-user-1',
    profile: {
      userId: 'user-1',
      companyId: 'company-1',
      companyName: 'Acme Co',
      isAdmin: false,
      personId: 'person-1',
      displayName: 'Vera Viewer',
      firstName: 'Vera',
      lastName: 'Viewer',
      email: 'user@myhrdepot.com',
      roleNames: roles,
    },
    roles,
  });
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MhdCalendarPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMhdCompanies.mockReturnValue({
    data: [
      { id: 'company-1', companyName: 'Acme Co' },
      { id: 'company-2', companyName: 'Globex' },
    ],
    isLoading: false,
    error: null,
  });
  mockUseMhdPeoplePicker.mockReturnValue({
    data: [
      { id: 'person-1', displayName: 'Pat Person' },
      { id: 'person-2', displayName: 'Robin Manager' },
    ],
    isLoading: false,
    error: null,
  });
  mockUseMhdCalendarEvents.mockReturnValue({
    data: [baseEvent],
    isLoading: false,
    error: null,
  });
});

describe('MhdCalendarPage access-aware filters', () => {
  it('shows a Company select with All Companies for a Platform Admin', () => {
    mockAuth(['Platform Admin']);

    renderPage();

    expect(screen.getByLabelText('Company')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'All Companies' })).toBeInTheDocument();
  });

  it('hides the Company select for an HR Partner', () => {
    mockAuth(['HR Partner']);

    renderPage();

    expect(screen.queryByLabelText('Company')).not.toBeInTheDocument();
  });

  it('renders the People filter for a non-Platform-Admin resolved company', () => {
    mockAuth(['Employee']);

    renderPage();

    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('All people')).toBeInTheDocument();
  });

  it('hides the People filter while a Platform Admin has All Companies selected', () => {
    mockAuth(['Platform Admin']);

    renderPage();

    expect(screen.queryByText('People')).not.toBeInTheDocument();
    expect(screen.queryByText('All people')).not.toBeInTheDocument();
  });

  it('renders the People filter after a Platform Admin picks a specific company', () => {
    mockAuth(['Platform Admin']);

    renderPage();
    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'company-1' } });

    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('All people')).toBeInTheDocument();
  });

  it('renders clickable Month, Week, and Agenda view switches', () => {
    mockAuth(['Employee']);

    renderPage();

    expect(screen.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Agenda' }));
    expect(screen.getByRole('button', { name: 'Agenda' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders calendar events as links to their detail path', () => {
    mockAuth(['Employee']);

    renderPage();

    const eventTitle = screen.getByText('Finalize onboarding packet');
    expect(eventTitle.closest('a')).toHaveAttribute('href', '/tasks/task-1');
  });
});
