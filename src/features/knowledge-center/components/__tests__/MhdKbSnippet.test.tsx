import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MhdKbSnippet } from '../MhdKbSnippet';

describe('MhdKbSnippet', () => {
  it('renders only the trusted mark tokens as mark elements', () => {
    const { container } = render(
      <MhdKbSnippet snippet="a <mark>b</mark> <script>alert(1)</script>" />,
    );

    expect(screen.getByText('b')).toHaveProperty('tagName', 'MARK');
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toBe('a b <script>alert(1)</script>');
  });

  it('does not crash or drop unmatched tokens', () => {
    const { container } = render(<MhdKbSnippet snippet="unmatched <mark> token" />);
    expect(container.textContent).toBe('unmatched <mark> token');
  });
});
