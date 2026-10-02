import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MhdRequisitionWizard from '../requisitions/components/MhdRequisitionWizard';

const createRequisition = vi.fn();
const transitionRequisition = vi.fn();
const jobs = [
  {
    id: 'job-payroll',
    referenceId: 'JOB-PAYROLL',
    jobTitle: 'Senior Payroll Specialist',
    jobCode: 'PAY-2',
    jobFamily: 'Finance',
    jobLevel: 'Senior',
    department: 'Finance',
    flsaClassification: 'EXEMPT',
    flsaClassificationSource: 'MANUAL',
    employmentType: 'FULL_TIME',
    isSafetySensitive: false,
    industry: 'GENERAL',
    onetSocCode: null,
    caWageOrderClassification: null,
    payMin: 72000,
    payMax: 90000,
    payPeriod: 'ANNUAL',
    isActive: true,
    incumbentCount: 1,
    publishedDescriptionId: null,
  },
  {
    id: 'job-support',
    referenceId: 'JOB-SUPPORT',
    jobTitle: 'Support Coordinator',
    jobCode: null,
    jobFamily: null,
    jobLevel: null,
    department: null,
    flsaClassification: null,
    flsaClassificationSource: 'MANUAL',
    employmentType: 'PART_TIME',
    isSafetySensitive: false,
    industry: 'GENERAL',
    onetSocCode: null,
    caWageOrderClassification: null,
    payMin: null,
    payMax: null,
    payPeriod: null,
    isActive: true,
    incumbentCount: 0,
    publishedDescriptionId: null,
  },
];

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({ profile: { companyId: 'company-acme' } }),
}));
vi.mock('@/features/jobs/Hook', () => ({ useMhdJobs: () => ({ data: jobs }) }));
vi.mock('../requisitions/Hook', () => ({
  useMhdRecruitingPeople: () => ({ data: [{ id: 'person-avery', displayName: 'Avery Manager' }] }),
  useMhdCreateRequisition: () => ({ mutateAsync: createRequisition }),
  useMhdTransitionRequisition: () => ({ mutateAsync: transitionRequisition }),
}));
vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: ({
    templateKey,
    entityType,
    entityId,
  }: {
    templateKey: string;
    entityType: string;
    entityId: string;
  }) => (
    <div>
      Document step: {templateKey} for {entityType} {entityId}
    </div>
  ),
}));

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/recruiting/requisitions/new']}>
      <Routes>
        <Route path="/recruiting/requisitions/new" element={<MhdRequisitionWizard />} />
        <Route path="/recruiting/requisitions/:reqId" element={<div>Requisition opened</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function next() {
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
}

function chooseJob() {
  fireEvent.change(screen.getByLabelText('Job'), { target: { value: 'job-payroll' } });
}

beforeEach(() => {
  createRequisition.mockReset();
  transitionRequisition.mockReset();
  createRequisition.mockResolvedValue({ id: 'req-105', referenceId: 'REQ-105' });
  transitionRequisition.mockResolvedValue({ id: 'req-105', referenceId: 'REQ-105' });
});

describe('MhdRequisitionWizard', () => {
  it('creates once with derived values, skips Draft transition, and opens the requisition', async () => {
    renderWizard();
    chooseJob();
    next();
    fireEvent.change(screen.getByLabelText('Hiring manager'), {
      target: { value: 'person-avery' },
    });
    fireEvent.change(screen.getByLabelText('Location'), { target: { value: 'Oakland' } });
    fireEvent.change(screen.getByLabelText('Headcount'), { target: { value: '3' } });
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(createRequisition).toHaveBeenCalledTimes(1));
    expect(createRequisition).toHaveBeenCalledWith({
      companyId: 'company-acme',
      title: 'Senior Payroll Specialist',
      jobId: 'job-payroll',
      hiringManagerPersonId: 'person-avery',
      department: 'Finance',
      location: 'Oakland',
      employmentType: 'Full time',
      headcount: 3,
      requiresApproval: false,
    });
    expect(transitionRequisition).not.toHaveBeenCalled();
    expect(await screen.findByText('Requisition Created')).toBeInTheDocument();
    expect(
      screen.getByText('Document step: REQUISITION_APPROVAL_RECORD for REQUISITION req-105'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Requisition' }));
    expect(await screen.findByText('Requisition opened')).toBeInTheDocument();
  });

  it('validates job and title and only shows present job details', () => {
    renderWizard();
    next();
    expect(screen.getByRole('alert')).toHaveTextContent('Select the job this requisition is for.');
    chooseJob();
    fireEvent.change(screen.getByLabelText('Requisition title'), { target: { value: '' } });
    next();
    expect(screen.getByRole('alert')).toHaveTextContent('A title is required.');
    expect(screen.getByText('Department')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Job'), { target: { value: 'job-support' } });
    expect(screen.queryByText('Pay range')).not.toBeInTheDocument();
    expect(screen.queryByText('FLSA classification')).not.toBeInTheDocument();
  });

  it('keeps derived values until the user overtypes the title', () => {
    renderWizard();
    chooseJob();
    expect(screen.getByLabelText('Requisition title')).toHaveValue('Senior Payroll Specialist');
    fireEvent.change(screen.getByLabelText('Requisition title'), {
      target: { value: 'Payroll Lead' },
    });
    fireEvent.change(screen.getByLabelText('Job'), { target: { value: 'job-support' } });
    expect(screen.getByLabelText('Requisition title')).toHaveValue('Payroll Lead');
    next();
    expect(screen.getByLabelText('Department')).toHaveValue('');
    expect(screen.getByLabelText('Employment type')).toHaveValue('Part time');
  });

  it('validates zero and non-integer headcount', () => {
    renderWizard();
    chooseJob();
    next();
    fireEvent.change(screen.getByLabelText('Headcount'), { target: { value: '0' } });
    next();
    expect(screen.getByRole('alert')).toHaveTextContent('Headcount must be at least 1.');
    fireEvent.change(screen.getByLabelText('Headcount'), { target: { value: '1.5' } });
    next();
    expect(screen.getByRole('alert')).toHaveTextContent('Headcount must be a whole number.');
  });

  it('offers approval-specific statuses and transitions to Pending Approval', async () => {
    renderWizard();
    chooseJob();
    next();
    next();
    expect(screen.getByLabelText('Starting status')).toHaveValue('DRAFT');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByLabelText('Starting status')).toHaveValue('PENDING_APPROVAL');
    expect(screen.getByRole('option', { name: 'Pending approval' })).toBeInTheDocument();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(transitionRequisition).toHaveBeenCalledWith({
        reqId: 'req-105',
        newStatus: 'PENDING_APPROVAL',
      }),
    );
  });

  it('shows transition failure and retries transition without creating twice', async () => {
    transitionRequisition
      .mockRejectedValueOnce(new Error('Approval transition refused.'))
      .mockResolvedValue({});
    renderWizard();
    chooseJob();
    next();
    next();
    fireEvent.click(screen.getByRole('checkbox'));
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Approval transition refused.');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(screen.getByText('Requisition Created')).toBeInTheDocument());
    expect(createRequisition).toHaveBeenCalledTimes(1);
    expect(transitionRequisition).toHaveBeenCalledTimes(2);
  });

  it('shows create refusal and succeeds on retry', async () => {
    createRequisition
      .mockRejectedValueOnce(new Error('A job is required.'))
      .mockResolvedValue({ id: 'req-106', referenceId: 'REQ-106' });
    renderWizard();
    chooseJob();
    next();
    next();
    next();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('A job is required.');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(screen.getByText(/REQ-106/)).toBeInTheDocument());
    expect(createRequisition).toHaveBeenCalledTimes(2);
  });
});
