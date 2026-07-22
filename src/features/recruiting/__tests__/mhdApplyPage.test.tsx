import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockSubmitApplication, mockSubmitEeo } = vi.hoisted(() => ({
  mockSubmitApplication: vi.fn(),
  mockSubmitEeo: vi.fn(),
}));

// Mock the requisitions package service the public apply page calls DIRECTLY (no
// react-query hook, no auth session) — the same posture as the e-sign /sign page.
vi.mock('../requisitions/Service', () => ({
  mhdRecruitingService: {
    submitApplication: mockSubmitApplication,
    submitEeo: mockSubmitEeo,
  },
}));

const { MhdApplyPage } = await import('../requisitions/components/MhdApplyPage');

describe('MhdApplyPage — public, token-driven, UNAUTHENTICATED', () => {
  beforeEach(() => {
    mockSubmitApplication.mockReset();
    mockSubmitEeo.mockReset();
  });

  it('submits the application with ONLY the invite token as credential — no session, no auth provider', async () => {
    mockSubmitApplication.mockResolvedValueOnce({ id: 'app-1', referenceId: 'APP-000001' });
    const user = userEvent.setup();

    // Rendered with NO MhdAuthProvider and NO company context — the page is public.
    // It reads the token from the ?token= query string, exactly like /apply?token=.
    render(
      <MemoryRouter initialEntries={['/apply?token=invite-token-123']}>
        <Routes>
          <Route path="/apply" element={<MhdApplyPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const submit = await screen.findByRole('button', { name: 'Submit application' });
    await user.click(submit);

    await waitFor(() => {
      expect(mockSubmitApplication).toHaveBeenCalledTimes(1);
    });
    // The token is the sole credential passed to the RPC; no user/company id.
    const arg = mockSubmitApplication.mock.calls[0][0];
    expect(arg.inviteToken).toBe('invite-token-123');
    expect(arg).not.toHaveProperty('companyId');
    expect(arg).not.toHaveProperty('personId');

    expect(await screen.findByText('Application submitted')).toBeInTheDocument();
  });

  it('refuses to submit when no token is present (the link is the only entry)', async () => {
    render(
      <MemoryRouter initialEntries={['/apply']}>
        <Routes>
          <Route path="/apply" element={<MhdApplyPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('This apply link cannot be used')).toBeInTheDocument();
    expect(mockSubmitApplication).not.toHaveBeenCalled();
  });
});
