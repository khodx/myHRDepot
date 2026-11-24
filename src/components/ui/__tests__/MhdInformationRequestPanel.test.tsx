import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const PERSON_ID = '5c1f9a20-6d3e-4b87-8a14-0e2b7d9c3f51';
const CASE_ID = 'a7e3c2d4-1b58-4f09-9d6a-3c8e5b1f7a20';

const { auth, requests, createAsync, respondAsync, draft } = vi.hoisted(() => ({
  auth: {
    current: {
      profile: { personId: null as string | null, companyId: null },
      roles: [] as string[],
    },
  },
  requests: { current: [] as unknown[] },
  createAsync: vi.fn(),
  respondAsync: vi.fn(),
  draft: {
    draft: null,
    shared: [],
    savedAt: null,
    saveError: null,
    isSaving: false,
    save: vi.fn(),
    discard: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => auth.current }));
vi.mock('@/features/drafts/Hook', () => ({ useMhdDraft: () => draft }));
vi.mock('@/features/benefit-intake/Hook', () => ({
  useMhdInformationRequests: () => ({ isLoading: false, error: null, data: requests.current }),
  useMhdInformationRequestThread: () => ({ isLoading: false, error: null, data: [] }),
  useMhdCreateInformationRequest: () => ({ mutateAsync: createAsync, isPending: false }),
  useMhdRespondToInformationRequest: () => ({ mutateAsync: respondAsync, isPending: false }),
}));

const { MhdInformationRequestPanel } = await import('../MhdInformationRequestPanel');

const OPEN_REQUEST = {
  activityId: 'f2d85b13-9c40-4e7a-b6d1-8a3c0e5f2b94',
  title: 'Information request',
  question: 'Please confirm your expected return date.',
  status: 'PLANNED',
  dueAt: '2026-12-05T00:00:00Z',
  createdAt: '2026-11-23T17:00:00Z',
  followUpTaskId: null,
};

function renderPanel(caseType: 'LEAVE' | 'ACCOMMODATION' = 'LEAVE') {
  return render(
    <MemoryRouter>
      <MhdInformationRequestPanel caseType={caseType} caseId={CASE_ID} personId={PERSON_ID} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  requests.current = [OPEN_REQUEST];
  auth.current = { profile: { personId: null, companyId: null }, roles: [] };
  createAsync.mockResolvedValue({});
  respondAsync.mockResolvedValue(undefined);
  draft.discard.mockResolvedValue(undefined);
});

describe('MhdInformationRequestPanel', () => {
  it('lets an administrator ask for more information and shows the request details', () => {
    auth.current = { profile: { personId: null, companyId: null }, roles: ['HR Partner'] };
    renderPanel();
    expect(screen.getByRole('button', { name: 'Request More Information' })).toBeInTheDocument();
    expect(screen.getByText('Please confirm your expected return date.')).toBeInTheDocument();
    expect(screen.getByText('Awaiting Response')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Activity' })).toHaveAttribute(
      'href',
      `/activities/${OPEN_REQUEST.activityId}`,
    );
    expect(screen.queryByRole('button', { name: 'Respond' })).not.toBeInTheDocument();
  });

  it("lets the case's own employee respond, and nobody else", async () => {
    auth.current = { profile: { personId: PERSON_ID, companyId: null }, roles: ['Client User'] };
    renderPanel();
    expect(
      screen.queryByRole('button', { name: 'Request More Information' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Respond' }));
    fireEvent.change(screen.getByLabelText(/your response/i), {
      target: { value: 'I expect to return on January 5.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Response' }));
    await waitFor(() =>
      expect(respondAsync).toHaveBeenCalledWith({
        activityId: OPEN_REQUEST.activityId,
        response: 'I expect to return on January 5.',
      }),
    );
  });

  it('shows another role neither action and renders nothing', () => {
    auth.current = {
      profile: { personId: 'someone-else', companyId: null },
      roles: ['Client User'],
    };
    const { container } = renderPanel();
    expect(container).toBeEmptyDOMElement();
  });

  it('refuses a response that contains prohibited medical detail', async () => {
    auth.current = { profile: { personId: PERSON_ID, companyId: null }, roles: ['Client User'] };
    renderPanel();
    fireEvent.click(screen.getByRole('button', { name: 'Respond' }));
    fireEvent.change(screen.getByLabelText(/your response/i), {
      target: { value: 'The diagnosis is on file.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send Response' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(respondAsync).not.toHaveBeenCalled();
  });

  it('shows a closed request without a Respond button', () => {
    requests.current = [{ ...OPEN_REQUEST, status: 'COMPLETED' }];
    auth.current = { profile: { personId: PERSON_ID, companyId: null }, roles: ['Client User'] };
    renderPanel();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Respond' })).not.toBeInTheDocument();
  });

  it('requires a question and a future due date before sending a request', async () => {
    auth.current = { profile: { personId: null, companyId: null }, roles: ['Platform Admin'] };
    renderPanel('ACCOMMODATION');
    fireEvent.click(screen.getByRole('button', { name: 'Request More Information' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send Request' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(createAsync).not.toHaveBeenCalled();
  });
});
