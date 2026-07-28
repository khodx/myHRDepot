import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdAuthRoleName } from '@/features/authentication/Types';
import type { MhdPropertyAssignment, MhdPropertyItem } from '../Types';

const {
  mockUseMhdAuth,
  mockUseMhdPropertyActions,
  mockUseMhdPropertyAssignments,
  mockUseMhdPropertyItem,
  mockUseMhdPropertyItems,
  mockUseMhdPropertyPeople,
} = vi.hoisted(() => ({
  mockUseMhdAuth: vi.fn(),
  mockUseMhdPropertyActions: vi.fn(),
  mockUseMhdPropertyAssignments: vi.fn(),
  mockUseMhdPropertyItem: vi.fn(),
  mockUseMhdPropertyItems: vi.fn(),
  mockUseMhdPropertyPeople: vi.fn(),
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => mockUseMhdAuth(),
}));

vi.mock('../Hook', () => ({
  useMhdPropertyActions: () => mockUseMhdPropertyActions(),
  useMhdPropertyAssignments: (filter: {
    propertyItemId?: string | null;
    personId?: string | null;
  }) => mockUseMhdPropertyAssignments(filter),
  useMhdPropertyItem: (companyId: string | null, itemId: string | null) =>
    mockUseMhdPropertyItem(companyId, itemId),
  useMhdPropertyItems: (companyId: string | null) => mockUseMhdPropertyItems(companyId),
  useMhdPropertyPeople: (companyId: string | null, enabled?: boolean) =>
    mockUseMhdPropertyPeople(companyId, enabled),
}));

const { MhdPropertyPage } = await import('../components/MhdPropertyPage');
const { MhdPropertyDetailPage } = await import('../components/MhdPropertyDetailPage');

const baseItem: MhdPropertyItem = {
  id: 'item-1',
  referenceId: 'PROP-000001',
  companyId: 'company-1',
  category: 'ELECTRONICS',
  name: 'MacBook Pro 14"',
  description: 'Primary engineering laptop',
  serialNumber: 'SN-001',
  quantityTotal: 3,
  quantityAvailable: 2,
  unitCost: 1999,
  acquisitionDate: '2026-07-01',
  status: 'ASSIGNED',
  conditionNotes: 'Good condition',
  createdAt: '2026-07-01T00:00:00Z',
  createdBy: 'user-1',
};

const issuedAssignment: MhdPropertyAssignment = {
  id: 'assignment-1',
  referenceId: 'PASN-000001',
  companyId: 'company-1',
  propertyItemId: 'item-1',
  personId: 'person-1',
  itemName: 'MacBook Pro 14"',
  personDisplayName: 'Pat Person',
  quantity: 1,
  status: 'ISSUED',
  issuedAt: '2026-07-10T00:00:00Z',
  issuedBy: 'user-1',
  issuerDisplayName: 'Olivia Office',
  issuerTitle: 'Office Manager',
  issuanceConditionNotes: 'No visible damage',
  employeeAckReceipt: true,
  employeeAckMaintain: true,
  employeeAckReportLoss: true,
  employeeAckPolicy: true,
  employeeSignatureName: 'Pat Person',
  employeeSignatureAt: '2026-07-10T00:00:00Z',
  returnedAt: null,
  receivedBy: null,
  receiverDisplayName: null,
  receiverTitle: null,
  returnConditionNotes: null,
  returnAckReturned: null,
  returnAckMaintained: null,
  returnAckLiability: null,
  employeeReturnSignatureName: null,
  employeeReturnSignatureAt: null,
};

function mockAuth(roles: MhdAuthRoleName[]) {
  mockUseMhdAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    userEmail: 'user@myhrdepot.com',
    authUserId: 'auth-user-1',
    profile: {
      userId: 'user-1',
      companyId: 'company-1',
      companyName: 'Acme Co',
      isAdmin: false,
      personId: 'person-1',
      displayName: 'Vera Viewer',
      firstName: 'Vera',
      lastName: 'Viewer',
      email: 'user@myhrdepot.com',
      roleNames: roles,
    },
    roles,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseMhdPropertyActions.mockReturnValue({
    createItem: { mutateAsync: vi.fn(), isPending: false },
    updateItem: { mutateAsync: vi.fn(), isPending: false },
    deleteItem: { mutateAsync: vi.fn(), isPending: false },
    issue: { mutateAsync: vi.fn(), isPending: false },
    returnItem: { mutateAsync: vi.fn(), isPending: false },
    markLostOrDamaged: { mutateAsync: vi.fn(), isPending: false },
  });
  mockUseMhdPropertyItems.mockReturnValue({
    data: [baseItem],
    isLoading: false,
    error: null,
  });
  mockUseMhdPropertyItem.mockReturnValue({
    data: baseItem,
    isLoading: false,
    error: null,
  });
  mockUseMhdPropertyAssignments.mockReturnValue({
    data: [issuedAssignment],
    isLoading: false,
    error: null,
  });
  mockUseMhdPropertyPeople.mockReturnValue({
    data: [{ id: 'person-1', displayName: 'Pat Person' }],
    isLoading: false,
    error: null,
  });
});

describe('MhdPropertyPage role gating', () => {
  it('hides the create affordance for a Viewer', () => {
    mockAuth(['Viewer']);

    render(
      <MemoryRouter>
        <MhdPropertyPage />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Add Property Item')).not.toBeInTheDocument();
    // Row actions collapse into a kebab menu; open it to see the actual links.
    // Menu items carry an explicit role="menuitem" (correct ARIA for a menu
    // popup), so they're queried as menuitem, not the anchor's implicit link role.
    fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    expect(screen.getByRole('menuitem', { name: 'View' })).toBeInTheDocument();
    // Edit renders as a disabled affordance, never a navigable link, for Viewers.
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('shows the create affordance and manage links for a Client Admin', () => {
    mockAuth(['Client Admin']);

    render(
      <MemoryRouter>
        <MhdPropertyPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Add Property Item')).toBeInTheDocument();
    // Edit/Delete are no longer offered from the row menu for anyone — both
    // are only reachable from the record's own detail page (MhdDetailActions).
    fireEvent.click(screen.getByRole('button', { name: 'Row actions' }));
    expect(screen.getByRole('menuitem', { name: 'View' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
  });
});

describe('MhdPropertyDetailPage role gating', () => {
  it('hides item and assignment mutation controls for a Viewer', () => {
    mockAuth(['Viewer']);

    render(
      <MemoryRouter initialEntries={['/property/item-1']}>
        <Routes>
          <Route path="/property/:itemId" element={<MhdPropertyDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('MacBook Pro 14"')).toBeInTheDocument();
    expect(screen.queryByText('Edit Item')).not.toBeInTheDocument();
    expect(screen.queryByText('Issue Property')).not.toBeInTheDocument();
    expect(screen.queryByText('Record Return')).not.toBeInTheDocument();
    expect(screen.queryByText('Mark Lost')).not.toBeInTheDocument();
    expect(screen.queryByText('Mark Damaged')).not.toBeInTheDocument();
  });

  it('shows item and assignment mutation controls for a Client Admin', () => {
    mockAuth(['Client Admin']);

    render(
      <MemoryRouter initialEntries={['/property/item-1']}>
        <Routes>
          <Route path="/property/:itemId" element={<MhdPropertyDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Edit/Delete now render twice (top + bottom action bar via MhdDetailActions).
    expect(screen.getAllByText('Edit Item').length).toBeGreaterThan(0);
    expect(screen.getByText('Issue Property')).toBeInTheDocument();
    expect(screen.getByText('Record Return')).toBeInTheDocument();
    expect(screen.getByText('Mark Lost')).toBeInTheDocument();
    expect(screen.getByText('Mark Damaged')).toBeInTheDocument();
  });
});
