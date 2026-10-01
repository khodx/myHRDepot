import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MhdKbArticleBody } from '../MhdKbArticleBody';

describe('MhdKbArticleBody', () => {
  it('preserves plain body markup as text', () => {
    const { container } = render(<MhdKbArticleBody body="<b>literal</b>" bodyFormat="plain" />);
    expect(screen.getByText('<b>literal</b>')).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
  });

  it('sanitizes rich body markup through the shared renderer', () => {
    const { container } = render(
      <MhdKbArticleBody
        body={
          '<script>alert(1)</script><img src=x onerror="alert(1)"><a href="javascript:alert(1)">link</a>'
        }
        bodyFormat="rich"
      />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
  });
});
