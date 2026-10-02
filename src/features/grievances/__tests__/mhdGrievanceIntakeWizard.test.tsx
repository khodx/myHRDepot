import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  open: vi.fn(),
  sign: vi.fn(),
  personId: 'person-filer' as string | null,
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => ({
    profile: { companyId: 'company-7', personId: state.personId, userId: 'user-7' },
  }),
}));

vi.mock('../Hook', () => ({
  useMhdOpenGrievanceFromIntake: () => ({ mutateAsync: state.open }),
  useMhdGrievancePeople: () => ({
    data: [
      { id: 'person-filer', firstName: 'Filer', lastName: 'Person', displayName: 'Filer Person' },
      { id: 'person-ana', firstName: 'Ana', lastName: 'Rivera', displayName: 'Ana Rivera' },
      { id: 'person-liam', firstName: 'Liam', lastName: 'Chen', displayName: 'Liam Chen' },
    ],
  }),
}));

vi.mock('../Service', () => ({
  mhdGrievancesService: { requestFilerSignature: state.sign },
}));

vi.mock('@/components/ui/MhdWizardOutputStep', () => ({
  MhdWizardOutputStep: (props: {
    templateKey: string;
    entityType: string;
    entityId: string;
    signing?: {
      createRequest: (generated: {
        generationId: string;
        documentHash: string;
      }) => Promise<{ requestId: string }>;
    };
  }) => (
    <div>
      <p>
        Document step: {props.templateKey} for {props.entityType} {props.entityId}
      </p>
      {props.signing ? (
        <button
          onClick={() =>
            void props.signing
              ?.createRequest({ generationId: 'generation-9', documentHash: 'hash-9' })
              .then((response) => {
                const node = document.createElement('span');
                node.textContent = response.requestId;
                document.body.appendChild(node);
              })
          }
        >
          Simulate Signing
        </button>
      ) : null}
    </div>
  ),
}));

const { MhdGrievanceIntakeWizard } = await import('../components/MhdGrievanceIntakeWizard');

function renderWizard() {
  return render(
    <MemoryRouter initialEntries={['/my-grievances/new']}>
      <Routes>
        <Route path="/my-grievances/new" element={<MhdGrievanceIntakeWizard />} />
        <Route path="/my-grievances" element={<p>My grievances page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function next() {
  const button = screen.getByRole('button', { name: 'Next' });
  await waitFor(() => expect(button).toBeEnabled());
  await userEvent.setup({ delay: null }).click(button);
}

async function fillAll() {
  const user = userEvent.setup({ delay: null });
  await user.selectOptions(screen.getByLabelText('Type of concern'), 'WORKING_CONDITIONS');
  await user.type(screen.getByLabelText('What happened'), 'A schedule changed without notice.');
  await user.type(screen.getByLabelText('When it happened'), '09/14/2026');
  await user.type(screen.getByLabelText('Where it happened'), 'North clinic');
  await user.selectOptions(screen.getByLabelText('Who this is about'), 'person-ana');
  await user.type(screen.getByLabelText('Others involved'), 'Liam was present.');
  await next();
  await user.type(
    screen.getByLabelText('Why do you disagree or object'),
    'The published process was not followed.',
  );
  await user.type(screen.getByLabelText('Why do you think it happened'), 'The handoff was missed.');
  await user.type(
    screen.getByLabelText('What have you already tried'),
    'I spoke with Human Resources.',
  );
  await next();
  await user.type(
    screen.getByLabelText('What outcome are you asking for'),
    'Please restore the published schedule.',
  );
  await user.click(screen.getByRole('button', { name: 'Add A Witness' }));
  await user.selectOptions(screen.getByLabelText('Choose a colleague'), 'person-liam');
  await user.type(screen.getByLabelText('What they know'), 'They saw the schedule change.');
  await next();
  await user.type(screen.getByLabelText('Your full name'), 'Filer Person');
  await user.click(screen.getByLabelText(/By typing my name/));
}

beforeEach(() => {
  state.personId = 'person-filer';
  state.open.mockReset().mockResolvedValue({
    id: 'grievance-9',
    referenceId: 'GRV-1009',
    status: 'SUBMITTED',
    referred: false,
  });
  state.sign.mockReset().mockResolvedValue({ requestId: 'request-9', invitationErrors: [] });
});

describe('MhdGrievanceIntakeWizard', () => {
  it('walks every step and submits the exact atomic intake input once', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await fillAll();
    await user.click(screen.getByRole('button', { name: /^submit$/i }));
    expect(await screen.findByText('Grievance Filed')).toBeInTheDocument();
    expect(state.open).toHaveBeenCalledTimes(1);
    expect(state.open).toHaveBeenCalledWith({
      companyId: 'company-7',
      personId: 'person-filer',
      grievanceWhat: 'A schedule changed without notice.',
      disagreementExplanation: 'The published process was not followed.',
      remedyRequested: 'Please restore the published schedule.',
      employeeSignatureName: 'Filer Person',
      grievanceCategory: 'WORKING_CONDITIONS',
      personGrievedAgainstId: 'person-ana',
      grievanceWho: 'Liam was present.',
      grievanceWhere: 'North clinic',
      grievanceWhen: new Date('2026-09-14T12:00:00').toISOString(),
      grievanceWhy: 'The handoff was missed.',
      stepsAlreadyTaken: 'I spoke with Human Resources.',
      isHarassmentRelated: false,
      retaliationConcern: false,
      concernsUnrecordedOralReprimand: false,
      witnesses: [
        {
          witnessName: 'Liam Chen',
          witnessPersonId: 'person-liam',
          whatTheyKnow: 'They saw the schedule change.',
        },
      ],
    });
    expect(
      screen.getByText('Document step: GRIEVANCE_ACKNOWLEDGMENT for GRIEVANCE grievance-9'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back To My Grievances' }));
    expect(await screen.findByText('My grievances page')).toBeInTheDocument();
  });

  it('shows validation on every step and does not submit until corrected', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    await next();
    expect(screen.getByRole('alert')).toHaveTextContent('Describe what happened.');
    await user.type(screen.getByLabelText('What happened'), 'Something happened.');
    await user.type(screen.getByLabelText('When it happened'), '12/31/2099');
    await next();
    expect(screen.getByRole('alert')).toHaveTextContent('The date cannot be in the future.');
    await user.clear(screen.getByLabelText('When it happened'));
    await user.type(screen.getByLabelText('When it happened'), '09/14/2026');
    await next();
    await next();
    expect(screen.getByRole('alert')).toHaveTextContent('Explain why you disagree or object.');
    await user.type(
      screen.getByLabelText('Why do you disagree or object'),
      'I disagree with this.',
    );
    await next();
    await next();
    expect(screen.getByRole('alert')).toHaveTextContent('Say what outcome you are asking for.');
    await user.type(screen.getByLabelText('What outcome are you asking for'), 'A fair review.');
    await next();
    await user.click(screen.getByRole('button', { name: /^submit$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Type your full name to sign.');
    await user.type(screen.getByLabelText('Your full name'), 'Filer Person');
    await user.click(screen.getByRole('button', { name: /^submit$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Confirm that this is accurate before you submit.',
    );
    expect(state.open).not.toHaveBeenCalled();
  });

  it('supports witness limits and removal, excludes the filer, and delegates receipt signing', async () => {
    const user = userEvent.setup({ delay: null });
    renderWizard();
    expect(screen.getByLabelText('Who this is about')).not.toHaveValue('person-filer');
    await user.type(screen.getByLabelText('What happened'), 'A concern.');
    await next();
    await user.type(screen.getByLabelText('Why do you disagree or object'), 'I disagree.');
    await next();
    await user.type(screen.getByLabelText('What outcome are you asking for'), 'A review.');
    for (let index = 0; index < 10; index += 1)
      await user.click(screen.getByRole('button', { name: 'Add A Witness' }));
    expect(screen.getByRole('button', { name: 'Add A Witness' })).toBeDisabled();
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0]);
    expect(screen.getByRole('button', { name: 'Add A Witness' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Add A Witness' }));
  });

  it('shows harassment referral, retries a refusal, and signs the receipt', async () => {
    const user = userEvent.setup({ delay: null });
    state.open
      .mockRejectedValueOnce(new Error('The grievance could not be filed.'))
      .mockResolvedValueOnce({
        id: 'grievance-9',
        referenceId: 'GRV-1009',
        status: 'SUBMITTED',
        referred: true,
      });
    renderWizard();
    await user.type(screen.getByLabelText('What happened'), 'A concern.');
    await next();
    await user.type(screen.getByLabelText('Why do you disagree or object'), 'I disagree.');
    await next();
    await user.type(screen.getByLabelText('What outcome are you asking for'), 'A review.');
    await user.click(screen.getByLabelText('This concerns harassment or discrimination'));
    await next();
    await user.type(screen.getByLabelText('Your full name'), 'Filer Person');
    await user.click(screen.getByLabelText(/By typing my name/));
    await user.click(screen.getByRole('button', { name: /^submit$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The grievance could not be filed.');
    await user.click(screen.getByRole('button', { name: /^submit$/i }));
    expect(
      await screen.findByText(
        'Because you said this concerns harassment, it was sent for review right away.',
      ),
    ).toBeInTheDocument();
    expect(state.open).toHaveBeenCalledTimes(2);
    expect(state.open.mock.calls[1][0].isHarassmentRelated).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Simulate Signing' }));
    await waitFor(() =>
      expect(state.sign).toHaveBeenCalledWith({
        companyId: 'company-7',
        generationId: 'generation-9',
        documentHash: 'hash-9',
        userId: 'user-7',
      }),
    );
    expect(await screen.findByText('request-9')).toBeInTheDocument();
  });

  it('explains when no employee record is linked', async () => {
    state.personId = null;
    renderWizard();
    expect(
      screen.getByText(
        'Your account is not linked to an employee record, so a grievance cannot be filed. Contact Human Resources.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });
});
