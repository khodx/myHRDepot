import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../Hook', () => ({
  useMhdMyChecklistInstances: () => ({
    isLoading: false,
    data: [
      {
        id: 'instance-1',
        referenceId: 'CKLI-001',
        companyId: 'company-1',
        title: 'New Hire Checklist',
        status: 'IN_PROGRESS',
        dueDate: '2026-08-30',
        totalItems: 5,
        completedItems: 2,
      },
    ],
  }),
}));

const { MhdMyChecklistsPage } = await import('../components/MhdMyChecklistsPage');

describe('MhdMyChecklistsPage', () => {
  it('shows assigned checklist progress and links to the detail route', () => {
    render(
      <MemoryRouter>
        <MhdMyChecklistsPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('New Hire Checklist')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByRole('link', { name: /open/i })).toHaveAttribute(
      'href',
      '/checklists/instance-1',
    );
  });
});
