import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useMhdUnsavedChangesGuard } from '../useMhdUnsavedChangesGuard';

function Wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/wizard']}>{children}</MemoryRouter>;
}

describe('useMhdUnsavedChangesGuard', () => {
  it('registers the browser prompt only while active', () => {
    const { rerender } = renderHook(({ active }) => useMhdUnsavedChangesGuard(active), {
      wrapper: Wrapper,
      initialProps: { active: false },
    });

    const inactive = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(inactive);
    expect(inactive.defaultPrevented).toBe(false);

    rerender({ active: true });
    const active = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(active);
    expect(active.defaultPrevented).toBe(true);

    rerender({ active: false });
    const after = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });

  it('turns an in-app link click into a pending path instead of navigating', () => {
    function Harness({ active }: { active: boolean }) {
      const guard = useMhdUnsavedChangesGuard(active);
      return (
        <div>
          <a href="/people">People</a>
          <a href="https://example.com/out">External</a>
          <a href="/people" target="_blank">
            New Tab
          </a>
          <span data-testid="pending">{guard.pendingPath ?? 'none'}</span>
        </div>
      );
    }

    render(<Harness active />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText('People'));
    expect(screen.getByTestId('pending')).toHaveTextContent('/people');
  });

  it('leaves external links, new-tab links and modifier clicks alone', () => {
    function Harness() {
      const guard = useMhdUnsavedChangesGuard(true);
      return (
        <div>
          <a href="/people">People</a>
          <a href="https://example.com/out">External</a>
          <a href="/people" target="_blank">
            New Tab
          </a>
          <span data-testid="pending">{guard.pendingPath ?? 'none'}</span>
        </div>
      );
    }

    render(<Harness />, { wrapper: Wrapper });

    fireEvent.click(screen.getByText('External'));
    fireEvent.click(screen.getByText('New Tab'));
    fireEvent.click(screen.getByText('People'), { ctrlKey: true });

    expect(screen.getByTestId('pending')).toHaveTextContent('none');
  });

  it('does not intercept anything while inactive', () => {
    function Harness() {
      const guard = useMhdUnsavedChangesGuard(false);
      return (
        <div>
          <a href="/people">People</a>
          <span data-testid="pending">{guard.pendingPath ?? 'none'}</span>
        </div>
      );
    }

    render(<Harness />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText('People'));
    expect(screen.getByTestId('pending')).toHaveTextContent('none');
  });

  it('requestLeave asks first when active, and confirmLeave then navigates', () => {
    function Harness() {
      const guard = useMhdUnsavedChangesGuard(true);
      return (
        <div>
          <button onClick={() => guard.requestLeave('/list')}>Cancel</button>
          <button onClick={guard.confirmLeave}>Confirm</button>
          <button onClick={guard.stay}>Stay</button>
          <span data-testid="pending">{guard.pendingPath ?? 'none'}</span>
        </div>
      );
    }

    render(
      <MemoryRouter initialEntries={['/wizard']}>
        <Routes>
          <Route path="/wizard" element={<Harness />} />
          <Route path="/list" element={<p>List page</p>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByTestId('pending')).toHaveTextContent('/list');

    fireEvent.click(screen.getByText('Stay'));
    expect(screen.getByTestId('pending')).toHaveTextContent('none');

    fireEvent.click(screen.getByText('Cancel'));
    fireEvent.click(screen.getByText('Confirm'));
    expect(screen.getByText('List page')).toBeInTheDocument();
  });

  it('requestLeave navigates straight away when nothing is at risk', () => {
    function Harness() {
      const guard = useMhdUnsavedChangesGuard(false);
      return <button onClick={() => guard.requestLeave('/list')}>Cancel</button>;
    }

    render(
      <MemoryRouter initialEntries={['/wizard']}>
        <Routes>
          <Route path="/wizard" element={<Harness />} />
          <Route path="/list" element={<p>List page</p>} />
        </Routes>
      </MemoryRouter>,
    );

    act(() => {
      fireEvent.click(screen.getByText('Cancel'));
    });
    expect(screen.getByText('List page')).toBeInTheDocument();
  });
});
