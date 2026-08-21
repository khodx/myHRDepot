import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdJobDescriptionWizard } from '../components/MhdJobDescriptionWizard';

const { mutate, draftMutate, noopMutation } = vi.hoisted(() => ({
  mutate: vi.fn().mockResolvedValue({ id: 'job-1' }),
  draftMutate: vi.fn().mockResolvedValue({ id: 'description-1' }),
  noopMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-1' } }),
}));
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual<typeof import('react-router-dom')>('react-router-dom')),
  useNavigate: () => vi.fn(),
}));
vi.mock('../Hook', () => ({
  useMhdCreateJob: () => ({ mutateAsync: mutate, isPending: false }),
  useMhdCreateDescriptionDraft: () => ({ mutateAsync: draftMutate, isPending: false }),
  useMhdUpdateDescriptionDraft: noopMutation,
  useMhdSetDescriptionFunctions: noopMutation,
  useMhdSetDescriptionQualifications: noopMutation,
  useMhdSetDescriptionCompetencies: noopMutation,
  useMhdPublishDescription: noopMutation,
  useMhdCompetencies: () => ({ data: [] }),
}));

function next() { fireEvent.click(screen.getByRole('button', { name: 'Next' })); }

describe('MhdJobDescriptionWizard', () => {
  beforeEach(() => { mutate.mockClear(); draftMutate.mockClear(); });

  it('blocks each job step until the accumulated job schema is valid', () => {
    render(<MhdJobDescriptionWizard />);
    next();
    expect(screen.getByText('Job title is required.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Driver' } });
    next();
    expect(screen.getByText('SOC & Wage Order')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('O*NET-SOC Code'), { target: { value: 'bad' } });
    next();
    expect(screen.getByText('Use an O*NET-SOC code, e.g. 53-3032.00')).toBeInTheDocument();
  });

  it('creates the job and draft only once after going back and forward', async () => {
    render(<MhdJobDescriptionWizard />);
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Driver' } });
    next(); next();
    await waitFor(() => expect(screen.getByText('Pay & FLSA')).toBeInTheDocument());
    next();
    await waitFor(() => expect(screen.getByText('Duties & Qualifications')).toBeInTheDocument());
    expect(mutate).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    next();
    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
  });

  it('keeps Previous side-effect-free', () => {
    render(<MhdJobDescriptionWizard />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(mutate).not.toHaveBeenCalled();
    expect(draftMutate).not.toHaveBeenCalled();
  });

  it('shows the publish gate when Review has no essential function', async () => {
    render(<MhdJobDescriptionWizard />);
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Driver' } });
    next(); next(); next();
    await waitFor(() => expect(screen.getByText('Duties & Qualifications')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Role summary'), { target: { value: 'A role summary' } });
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Drive safely' } });
    next();
    await waitFor(() => expect(screen.getByText('Competencies')).toBeInTheDocument());
    next();
    await waitFor(() => expect(screen.getByText('Review and publish')).toBeInTheDocument());
    // Two Previous clicks: Review -> Competencies -> Duties & Qualifications,
    // where the "Essential" checkbox actually lives.
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Essential' }));
    next();
    expect(screen.getByText(/Add at least one essential function/)).toBeInTheDocument();
  });
});
