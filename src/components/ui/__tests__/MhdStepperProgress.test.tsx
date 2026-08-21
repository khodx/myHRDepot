import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MhdStepperProgress } from '../MhdStepperProgress';

describe('MhdStepperProgress', () => {
  it('renders the current step and total steps', () => {
    render(<MhdStepperProgress currentStepIndex={1} totalSteps={4} />);

    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('4 total')).toBeInTheDocument();
  });

  it('reports progress based on the one-based step position', () => {
    render(<MhdStepperProgress currentStepIndex={1} totalSteps={4} />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('supports a custom step label, e.g. for Forms\' "Page" wording', () => {
    render(<MhdStepperProgress currentStepIndex={1} totalSteps={4} stepLabel="Page" />);

    expect(screen.getByText('Page 2')).toBeInTheDocument();
  });
});
