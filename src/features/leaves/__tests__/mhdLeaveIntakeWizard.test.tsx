import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdLeaveIntakeWizard } from '../components/MhdLeaveIntakeWizard';

const createAsync = vi.fn();
const evaluateAsync = vi.fn();
const confirmAsync = vi.fn();
const overrideAsync = vi.fn();
const navigate = vi.fn();

vi.mock('@/features/authentication/Hook', () => ({ useMhdAuth: () => ({ profile: { companyId: 'company-1' } }) }));
vi.mock('@/features/people/Hook', () => ({ useMhdPeoplePicker: () => ({ data: [{ id: 'person-1', firstName: 'Ada', lastName: 'Lovelace' }] }) }));
vi.mock('../Hook', () => ({ useMhdCreateLeaveCase: () => ({ mutateAsync: createAsync, isPending: false }) }));
vi.mock('../WorkflowHook', () => ({
  useMhdLeaveEligibility: () => ({ mutateAsync: evaluateAsync, isPending: false }),
  useMhdConfirmLeaveEligibility: () => ({ mutateAsync: confirmAsync, isPending: false }),
  useMhdOverrideLeaveEligibility: () => ({ mutateAsync: overrideAsync, isPending: false }),
  useMhdLeaveReadiness: () => ({ data: null }),
}));
vi.mock('@/components/ui/MhdComplianceGateBanner', () => ({ MhdComplianceGateBanner: () => null }));
vi.mock('@/components/ui/MhdPageHeader', () => ({ MhdPageHeader: ({ title }: { title: string }) => <h1>{title}</h1> }));
vi.mock('@/components/ui/MhdCard', () => ({ MhdCard: ({ children }: { children: ReactNode }) => <section>{children}</section> }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

const result = {
  determination_id: 'determination-1',
  snapshot_id: 'snapshot-1',
  leave_type_id: 'type-1',
  type_key: 'FMLA',
  evaluated_outcome: 'ELIGIBLE',
  entitlement_hours: 480,
  findings: [],
};

function renderWizard(initialEntry = '/leaves/new/intake') {
  // A bare <MhdLeaveIntakeWizard /> under MemoryRouter with no matching
  // <Route> leaves useParams() unable to resolve :caseId regardless of the
  // initial entry URL -- both real route patterns must be registered here,
  // matching AppRouter.tsx, for Entry B (/leaves/:caseId/intake) to work.
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/leaves/new/intake" element={<MhdLeaveIntakeWizard />} />
        <Route path="/leaves/:caseId/intake" element={<MhdLeaveIntakeWizard />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MhdLeaveIntakeWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAsync.mockResolvedValue({ id: 'case-1', referenceId: 'LV-1' });
    evaluateAsync.mockResolvedValue([result]);
    confirmAsync.mockResolvedValue(undefined);
    overrideAsync.mockResolvedValue(undefined);
  });

  it('uses the same wizard with Basics for a new case and without Basics for an existing case', () => {
    const { unmount } = renderWizard();
    expect(screen.getAllByText('Case Basics').length).toBeGreaterThan(0);
    unmount();
    renderWizard('/leaves/case-1/intake');
    expect(screen.queryByText('Case Basics')).not.toBeInTheDocument();
    expect(screen.getAllByText('Employer & Service Facts').length).toBeGreaterThan(0);
  });

  it('guards create and evaluate when navigating back and forward, while Previous stays side-effect-free', async () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText('Subject person'), { target: { value: 'person-1' } });
    fireEvent.change(screen.getByLabelText('Reason category'), { target: { value: 'Medical leave' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(createAsync).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(createAsync).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getAllByText('Employer & Service Facts').length).toBeGreaterThan(0));
    expect(createAsync).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
  });

  it('blocks Confirm or Override until the whole snapshot is confirmed', async () => {
    renderWizard('/leaves/case-1/intake');
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(evaluateAsync).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Confirm the snapshot before advancing.');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm all as evaluated' }));
    await waitFor(() => expect(confirmAsync).toHaveBeenCalledWith('snapshot-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getAllByText('Designation Summary').length).toBeGreaterThan(0);
  });
});
