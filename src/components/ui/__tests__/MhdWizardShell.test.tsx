import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useMhdWizardFlow, type MhdWizardStepDefinition } from '@/utils/useMhdWizardFlow';
import { MhdWizardShell } from '../MhdWizardShell';

function Harness({
  dirty = false,
  failLeaveOfFirst = false,
  withBanner = false,
}: {
  dirty?: boolean;
  failLeaveOfFirst?: boolean;
  withBanner?: boolean;
}) {
  const steps: MhdWizardStepDefinition[] = [
    {
      id: 'one',
      title: 'First Step',
      onLeave: failLeaveOfFirst ? () => Promise.reject(new Error('Could not save the first step.')) : undefined,
    },
    { id: 'two', title: 'Second Step' },
  ];
  const flow = useMhdWizardFlow({ steps, onSubmit: () => Promise.resolve(), isDirty: dirty });

  return (
    <MhdWizardShell
      title="Guided Intake"
      description="Walks through the request."
      flow={flow}
      cancelTo="/list"
      showProgress
      gateBanner={withBanner ? <p role="status">Content pending review</p> : undefined}
    >
      <p>{`Body of ${flow.currentStep?.id}`}</p>
    </MhdWizardShell>
  );
}

function renderShell(props: Parameters<typeof Harness>[0] = {}) {
  return render(
    <MemoryRouter initialEntries={['/wizard']}>
      <Routes>
        <Route path="/wizard" element={<Harness {...props} />} />
        <Route path="/list" element={<p>List page</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MhdWizardShell', () => {
  it('renders the header, gate banner, current step and progress', () => {
    renderShell({ withBanner: true });

    expect(screen.getByRole('heading', { name: 'Guided Intake' })).toBeInTheDocument();
    expect(screen.getByText('Walks through the request.')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Content pending review');
    expect(screen.getByRole('heading', { name: 'First Step' })).toBeInTheDocument();
    expect(screen.getByText('Body of one')).toBeInTheDocument();
    expect(screen.getByText('2 total')).toBeInTheDocument();
  });

  it('moves between steps through the stepper', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Body of two')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText('Body of one')).toBeInTheDocument();
  });

  it('shows a failed step save in the alert region and stays on the step', async () => {
    const user = userEvent.setup();
    renderShell({ failLeaveOfFirst: true });

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the first step.');
    expect(screen.getByText('Body of one')).toBeInTheDocument();
  });

  it('cancels straight to the list when nothing is unsaved', async () => {
    const user = userEvent.setup();
    renderShell({ dirty: false });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('List page')).toBeInTheDocument();
  });

  it('asks before cancelling when there is unsaved input, and lets the person stay', async () => {
    const user = userEvent.setup();
    renderShell({ dirty: true });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('dialog', { name: 'Leave this page?' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Stay On This Page' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Body of one')).toBeInTheDocument();
  });

  it('leaves for the destination once the person confirms', async () => {
    const user = userEvent.setup();
    renderShell({ dirty: true });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('button', { name: 'Leave Without Saving' }));

    expect(screen.getByText('List page')).toBeInTheDocument();
  });
});
