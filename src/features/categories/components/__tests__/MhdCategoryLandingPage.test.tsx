import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mockUseMhdAuth = vi.fn();
vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

function mockRoles(roles: string[]) {
  mockUseMhdAuth.mockReturnValue({ isAuthenticated: true, roles, profile: null });
}

async function renderAt(path: string) {
  const { MhdCategoryLandingPage } = await import('../MhdCategoryLandingPage');
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/categories/:categorySlug" element={<MhdCategoryLandingPage />} />
        <Route path="/404" element={<div>not-found</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.resetModules();
  mockRoles(['Platform Admin']);
});

describe('MhdCategoryLandingPage', () => {
  it('lists the category description and a card linking to each module', async () => {
    await renderAt('/categories/work-tools');

    expect(screen.getByRole('heading', { name: 'Work Tools' })).toBeInTheDocument();
    expect(screen.getByText('Everyday tools for getting work done.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tasks' })).toHaveAttribute('href', '/tasks');
    expect(screen.getByRole('link', { name: 'Forms' })).toHaveAttribute('href', '/forms');
  });

  it('shows companion links under their parent card', async () => {
    await renderAt('/categories/talent');

    expect(screen.getByRole('link', { name: 'Checklists' })).toHaveAttribute('href', '/checklists');
    expect(screen.getByRole('link', { name: 'My Checklists' })).toHaveAttribute(
      'href',
      '/my-checklists',
    );
  });

  it('only lists modules the role can open', async () => {
    mockRoles(['Viewer']);
    await renderAt('/categories/administration');

    expect(screen.queryByRole('link', { name: 'Admin Settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Lab & Sandbox' })).not.toBeInTheDocument();
    expect(screen.getByText(/No modules in Administration are available/)).toBeInTheDocument();
  });

  it('redirects an unknown category to the not-found page', async () => {
    await renderAt('/categories/not-a-category');
    expect(screen.getByText('not-found')).toBeInTheDocument();
  });
});
