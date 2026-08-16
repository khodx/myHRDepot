import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MhdCountBadge } from '../MhdCountBadge';

describe('MhdCountBadge', () => {
  it('renders the count', () => {
    render(<MhdCountBadge count={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('caps display at 9+', () => {
    render(<MhdCountBadge count={42} />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('renders nothing at zero', () => {
    const { container } = render(<MhdCountBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for a negative count', () => {
    const { container } = render(<MhdCountBadge count={-1} />);
    expect(container.firstChild).toBeNull();
  });

  it('is aria-hidden — the accessible label belongs to the parent', () => {
    render(<MhdCountBadge count={3} />);
    expect(screen.getByText('3')).toHaveAttribute('aria-hidden');
  });

  it('applies the warning variant class instead of the error default', () => {
    render(<MhdCountBadge count={1} variant="warning" />);
    expect(screen.getByText('1').className).toContain('bg-amber-500');
  });
});
