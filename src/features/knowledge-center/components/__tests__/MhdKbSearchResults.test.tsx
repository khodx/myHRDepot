import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { MhdKbSearchResults } from '../MhdKbSearchResults';

describe('MhdKbSearchResults', () => {
  it('shows the empty state and polite result count', () => {
    render(
      <MhdKbSearchResults
        results={[]}
        total={0}
        categories={[]}
        pagination={{
          page: 1,
          pageCount: 1,
          pageSize: 20,
          rangeStart: 0,
          rangeEnd: 0,
          canPrev: false,
          canNext: false,
          setPage: () => {},
          nextPage: () => {},
          prevPage: () => {},
          sliceItems: (items) => items,
        }}
      />,
      { wrapper: MemoryRouter },
    );
    expect(screen.getByText('0 results')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('No results found.')).toBeInTheDocument();
  });
});
