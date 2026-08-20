import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../Hook', () => ({
  useMhdChecklistInstance: () => ({
    isLoading: false,
    data: {
      id: 'instance-1',
      referenceId: 'CKLI-001',
      companyId: 'company-1',
      title: 'New Hire Checklist',
      status: 'IN_PROGRESS',
      assignedToPersonId: 'person-1',
      entityType: null,
      entityId: null,
      dueDate: null,
      completedAt: null,
      items: [],
    },
  }),
  useMhdCompleteChecklistItem: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

const { MhdChecklistInstanceDetailPage } = await import(
  '../components/MhdChecklistInstanceDetailPage'
);

describe('MhdChecklistInstanceDetailPage', () => {
  it('renders the instance header and an empty state when the checklist has no items', () => {
    render(
      <MemoryRouter initialEntries={['/checklists/instance-1']}>
        <Routes>
          <Route path="/checklists/:instanceId" element={<MhdChecklistInstanceDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('New Hire Checklist')).toBeInTheDocument();
    expect(screen.getByText('No items on this checklist')).toBeInTheDocument();
  });
});
