import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MhdTable, MhdTd, MhdTr } from '../MhdTable';

function TestTable({ onNestedClick = vi.fn() }: { onNestedClick?: () => void }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <MhdTable>
            <tbody>
              <MhdTr to="/detail">
                <MhdTd>Clickable row</MhdTd>
                <MhdTd>
                  <button type="button" onClick={onNestedClick}>
                    Nested action
                  </button>
                </MhdTd>
              </MhdTr>
            </tbody>
          </MhdTable>
        }
      />
      <Route path="/detail" element={<div>Detail page</div>} />
    </Routes>
  );
}

describe('MhdTr row navigation', () => {
  it('opens the detail route when clicking the row body', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestTable />
      </MemoryRouter>,
    );

    await user.click(screen.getByText('Clickable row'));

    expect(screen.getByText('Detail page')).toBeInTheDocument();
  });

  it('opens the detail route from keyboard activation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestTable />
      </MemoryRouter>,
    );

    screen.getByRole('link', { name: /clickable row/i }).focus();
    await user.keyboard('{Enter}');

    expect(screen.getByText('Detail page')).toBeInTheDocument();
  });

  it('does not navigate when a nested control is clicked', async () => {
    const user = userEvent.setup();
    const onNestedClick = vi.fn();

    render(
      <MemoryRouter initialEntries={['/']}>
        <TestTable onNestedClick={onNestedClick} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Nested action' }));

    expect(onNestedClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Detail page')).not.toBeInTheDocument();
  });
});
