import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MhdJobDescriptionWizard } from '../components/MhdJobDescriptionWizard';

const {
  mutate,
  draftMutate,
  noopMutation,
  onetSearchMutate,
  onetLookupMutate,
  updateJobMutate,
  payRangeMutate,
  publishMutate,
  navigateMock,
} = vi.hoisted(() => ({
  mutate: vi.fn().mockResolvedValue({ id: 'job-1' }),
  draftMutate: vi.fn().mockResolvedValue({ id: 'description-1' }),
  updateJobMutate: vi.fn().mockResolvedValue({}),
  payRangeMutate: vi.fn().mockResolvedValue({}),
  publishMutate: vi.fn().mockResolvedValue({}),
  navigateMock: vi.fn(),
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
  useNavigate: () => navigateMock,
}));
// The document step has its own tests; here we only care that it is offered for the right record.
vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: (props: { templateKey: string; entityType: string; entityId: string }) => (
    <p>{`Document step: ${props.templateKey} for ${props.entityType} ${props.entityId}`}</p>
  ),
}));
vi.mock('../Hook', () => ({
  useMhdCreateJob: () => ({ mutateAsync: mutate, isPending: false }),
  useMhdUpdateJob: () => ({ mutateAsync: updateJobMutate, isPending: false }),
  useMhdSetPayRange: () => ({ mutateAsync: payRangeMutate, isPending: false }),
  useMhdCreateDescriptionDraft: () => ({ mutateAsync: draftMutate, isPending: false }),
  useMhdUpdateDescriptionDraft: noopMutation,
  useMhdSetDescriptionFunctions: noopMutation,
  useMhdSetDescriptionQualifications: noopMutation,
  useMhdSetDescriptionCompetencies: noopMutation,
  useMhdPublishDescription: () => ({ mutateAsync: publishMutate, isPending: false }),
  useMhdCompetencies: () => ({ data: [] }),
  useMhdCareerOneStopOccupationLookup: noopMutation,
  useMhdOnetOccupationSearch: () => ({ mutateAsync: onetSearchMutate, isPending: false }),
  useMhdOnetOccupationLookup: () => ({ mutateAsync: onetLookupMutate, isPending: false }),
}));

function next() { fireEvent.click(screen.getByRole('button', { name: 'Next' })); }

function renderWizard() {
  return render(
    <MemoryRouter>
      <MhdJobDescriptionWizard />
    </MemoryRouter>,
  );
}

/** Fills the minimum a publishable description needs and stops on the Review step. */
async function walkToReview() {
  fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Driver' } });
  next(); next(); next();
  await waitFor(() => expect(screen.getAllByText('Duties & Qualifications').length).toBeGreaterThan(0));
  typeIntoRichText('Role summary', 'A role summary');
  fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Drive safely' } });
  next();
  await waitFor(() => expect(screen.getAllByText('Competencies').length).toBeGreaterThan(0));
  next();
  await waitFor(() => expect(screen.getByText('Review and publish')).toBeInTheDocument());
}

describe('MhdJobDescriptionWizard', () => {
  beforeEach(() => {
    for (const fn of [mutate, draftMutate, onetSearchMutate, onetLookupMutate, updateJobMutate, payRangeMutate, publishMutate, navigateMock]) fn.mockClear();
    mutate.mockResolvedValue({ id: 'job-1' });
    draftMutate.mockResolvedValue({ id: 'description-1' });
    publishMutate.mockResolvedValue({});
  });

  it('adds O*NET-suggested requirements into the education and physical requirements fields', async () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Driver' } });
    next();
    await waitFor(() => expect(screen.getAllByText('SOC & Wage Order').length).toBeGreaterThan(0));
    fireEvent.change(screen.getByLabelText('O*NET-SOC Code'), { target: { value: '53-3032.00' } });
    next(); next();
    await waitFor(() => expect(screen.getAllByText('Duties & Qualifications').length).toBeGreaterThan(0));

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
    renderWizard();
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Driver' } });
    next();
    await waitFor(() => expect(screen.getAllByText('SOC & Wage Order').length).toBeGreaterThan(0));
    fireEvent.change(screen.getByLabelText('Find an O*NET-SOC code by job title'), { target: { value: 'truck driver' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search O*NET' }));
    await waitFor(() => expect(onetSearchMutate).toHaveBeenCalledWith({ keyword: 'truck driver' }));
    fireEvent.click(await screen.findByText('Heavy and Tractor-Trailer Truck Drivers'));
    expect(screen.getByLabelText('O*NET-SOC Code')).toHaveValue('53-3032.00');
  });

  it('blocks each job step until the accumulated job schema is valid', () => {
    renderWizard();
    next();
    expect(screen.getByText('Job title is required.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Driver' } });
    next();
    expect(screen.getAllByText('SOC & Wage Order').length).toBeGreaterThan(0);
    fireEvent.change(screen.getByLabelText('O*NET-SOC Code'), { target: { value: 'bad' } });
    next();
    expect(screen.getByText('Use an O*NET-SOC code, e.g. 53-3032.00')).toBeInTheDocument();
  });

  it('writes nothing until the description is published, so abandoning leaves no half-built job', async () => {
    renderWizard();
    await walkToReview();
    expect(mutate).not.toHaveBeenCalled();
    expect(draftMutate).not.toHaveBeenCalled();
    expect(publishMutate).not.toHaveBeenCalled();
  });

  it('creates the job and draft once, publishes, then offers the job description document', async () => {
    renderWizard();
    await walkToReview();
    fireEvent.click(screen.getByRole('button', { name: /publish|submit|finish/i }));
    expect(await screen.findByText('Job Description Published')).toBeInTheDocument();
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(draftMutate).toHaveBeenCalledWith({ jobId: 'job-1', copyFrom: null });
    expect(publishMutate).toHaveBeenCalledWith({ descriptionId: 'description-1' });
    expect(
      screen.getByText('Document step: JOB_DESCRIPTION_RECORD for JOB_DESCRIPTION description-1'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Job' }));
    expect(navigateMock).toHaveBeenCalledWith('/jobs/job-1');
  });

  it('retries only what is missing after a failed publish, never creating a second job', async () => {
    publishMutate.mockRejectedValueOnce(new Error('Publish was refused.'));
    renderWizard();
    await walkToReview();
    fireEvent.click(screen.getByRole('button', { name: /publish|submit|finish/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Publish was refused.');
    fireEvent.click(screen.getByRole('button', { name: /publish|submit|finish/i }));
    expect(await screen.findByText('Job Description Published')).toBeInTheDocument();
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(draftMutate).toHaveBeenCalledTimes(1);
    expect(publishMutate).toHaveBeenCalledTimes(2);
  });

  it('carries a change made after a failed publish onto the job that already exists', async () => {
    publishMutate.mockRejectedValueOnce(new Error('Publish was refused.'));
    renderWizard();
    await walkToReview();
    fireEvent.click(screen.getByRole('button', { name: /publish|submit|finish/i }));
    await screen.findByRole('alert');
    for (let i = 0; i < 5; i += 1) fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Senior Driver' } });
    for (let i = 0; i < 5; i += 1) {
      next();
      await waitFor(() => expect(screen.getByRole('button', { name: /Previous/ })).toBeEnabled());
    }
    await waitFor(() => expect(screen.getByText('Review and publish')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /publish|submit|finish/i }));
    expect(await screen.findByText('Job Description Published')).toBeInTheDocument();
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(updateJobMutate).toHaveBeenCalledWith(expect.objectContaining({ jobId: 'job-1', jobTitle: 'Senior Driver' }));
  });

  it('keeps Previous side-effect-free', () => {
    renderWizard();
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(mutate).not.toHaveBeenCalled();
    expect(draftMutate).not.toHaveBeenCalled();
  });

  it('shows the publish gate when Review has no essential function', async () => {
    renderWizard();
    fireEvent.change(screen.getByLabelText('Job title'), { target: { value: 'Driver' } });
    next(); next(); next();
    await waitFor(() => expect(screen.getAllByText('Duties & Qualifications').length).toBeGreaterThan(0));
    typeIntoRichText('Role summary', 'A role summary');
    fireEvent.change(screen.getAllByRole('textbox')[1], { target: { value: 'Drive safely' } });
    next();
    await waitFor(() => expect(screen.getAllByText('Competencies').length).toBeGreaterThan(0));
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
