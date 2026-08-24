import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdJobDescriptionWizard } from '../components/MhdJobDescriptionWizard';

const { mutate, draftMutate, noopMutation, onetSearchMutate, onetLookupMutate } = vi.hoisted(() => ({
  mutate: vi.fn().mockResolvedValue({ id: 'job-1' }),
  draftMutate: vi.fn().mockResolvedValue({ id: 'description-1' }),
  noopMutation: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  onetSearchMutate: vi.fn().mockResolvedValue({
    success: true,
    mode: 'search',
    results: [{ code: '53-3032.00', title: 'Heavy and Tractor-Trailer Truck Drivers', brightOutlook: false }],
    source: 'O*NET attribution',
  }),
  onetLookupMutate: vi.fn().mockResolvedValue({
    success: true,
    mode: 'occupation',
    socCode: '53-3032.00',
    title: 'Heavy and Tractor-Trailer Truck Drivers',
    description: null,
    jobZone: { title: 'Job Zone Two', education: 'High school diploma preferred.', relatedExperience: null, jobTraining: null },
    educationBreakdown: [{ title: 'High school diploma', percentageOfRespondents: 60 }],
    workContext: ['Spend Time Sitting: Continually or almost continually'],
    source: 'O*NET attribution',
  }),
}));

/** MhdRichTextEditor's editable surface is a contentEditable div (aria-label
 * set, but no .value / change event) — simulate typing by setting textContent
 * directly and firing the input event the component actually listens for. */
function typeIntoRichText(label: string, text: string) {
  const editor = screen.getByLabelText(label);
  editor.textContent = text;
  fireEvent.input(editor);
}

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
  useMhdCareerOneStopOccupationLookup: noopMutation,
  useMhdOnetOccupationSearch: () => ({ mutateAsync: onetSearchMutate, isPending: false }),
  useMhdOnetOccupationLookup: () => ({ mutateAsync: onetLookupMutate, isPending: false }),
}));

function next() { fireEvent.click(screen.getByRole('button', { name: 'Next' })); }

describe('MhdJobDescriptionWizard', () => {
  beforeEach(() => { mutate.mockClear(); draftMutate.mockClear(); onetSearchMutate.mockClear(); onetLookupMutate.mockClear(); });

  it('adds O*NET-suggested requirements into the education and physical requirements fields', async () => {
    render(<MhdJobDescriptionWizard />);
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Driver' } });
    next();
    await waitFor(() => expect(screen.getByText('SOC & Wage Order')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('O*NET-SOC Code'), { target: { value: '53-3032.00' } });
    next(); next();
    await waitFor(() => expect(screen.getByText('Duties & Qualifications')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Suggest Requirements From O*NET Online' }));
    await waitFor(() => expect(onetLookupMutate).toHaveBeenCalledWith({ onetSocCode: '53-3032.00', includeRequirements: true }));

    const educationRow = screen.getByText('High school diploma preferred.').closest('div') as HTMLElement;
    fireEvent.click(within(educationRow).getByRole('button', { name: 'Add' }));
    expect(screen.getByLabelText('Education & Training Requirements').innerHTML).toContain('High school diploma preferred.');

    const workContextRow = screen.getByText('Spend Time Sitting: Continually or almost continually').closest('div') as HTMLElement;
    fireEvent.click(within(workContextRow).getByRole('button', { name: 'Add' }));
    expect(screen.getByLabelText('Physical Requirements').innerHTML).toContain('Spend Time Sitting');
  });

  it('fills the O*NET-SOC code from a search result', async () => {
    render(<MhdJobDescriptionWizard />);
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Driver' } });
    next();
    await waitFor(() => expect(screen.getByText('SOC & Wage Order')).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText('Find an O*NET-SOC code by job title'), { target: { value: 'truck driver' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search O*NET' }));
    await waitFor(() => expect(onetSearchMutate).toHaveBeenCalledWith({ keyword: 'truck driver' }));
    fireEvent.click(await screen.findByText('Heavy and Tractor-Trailer Truck Drivers'));
    expect(screen.getByLabelText('O*NET-SOC Code')).toHaveValue('53-3032.00');
  });

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
    typeIntoRichText('Role summary', 'A role summary');
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
