import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdBenefitIntakeTabs } from '@/components/ui/MhdBenefitIntakeTabs';

const drafts = vi.hoisted(() => ({ data: [{ id: 'draft-1', title: 'Saved request' }] }));

vi.mock('@/features/benefit-intake/Hook', () => ({
  useMhdBenefitIntakeDrafts: () => drafts,
}));

vi.mock('@/components/ui/MhdBenefitIntakeButton', () => ({
  MhdBenefitIntakeButton: ({ label }: { label?: string }) => (
    <button type="button">{label ?? 'Start Request'}</button>
  ),
}));

describe('MhdBenefitIntakeTabs', () => {
  it('shows the draft and status counts and reports the selected tab', () => {
    const onChange = vi.fn();
    render(
      <MhdBenefitIntakeTabs
        value="ALL"
        onChange={onChange}
        counts={{ ALL: 4, IN_PROGRESS: 2, SUBMITTED_CURRENT: 1 }}
      />,
    );

    expect(screen.getByRole('tab', { name: 'All (4)' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Drafts (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'In Progress (2)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Submitted / Current (1)' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'In Progress (2)' }));
    expect(onChange).toHaveBeenCalledWith('IN_PROGRESS');
  });
});
