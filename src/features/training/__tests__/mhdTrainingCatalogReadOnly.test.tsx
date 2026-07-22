import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MhdTrainingCourse } from '../Types';

// Mock the whole Hook module so the catalog renders against controlled data with
// no query client / network. Every hook the catalog (and the embedded compliance
// board) touches is stubbed.
const { coursesMock } = vi.hoisted(() => ({ coursesMock: vi.fn() }));
const emptyMutation = { mutateAsync: vi.fn(), isPending: false, isError: false, error: null };

vi.mock('../Hook', () => ({
  useMhdTrainingCourses: coursesMock,
  useMhdTrainingPeople: () => ({ data: [] }),
  useMhdCreateTrainingCourse: () => emptyMutation,
  useMhdUpdateTrainingCourse: () => emptyMutation,
  useMhdSetTrainingCourseActive: () => emptyMutation,
  useMhdAssignTraining: () => emptyMutation,
  useMhdTrainingComplianceMatrix: () => ({ data: [], isLoading: false }),
}));

const { MhdTrainingCatalogPage } = await import('../components/MhdTrainingCatalogPage');

function course(overrides: Partial<MhdTrainingCourse>): MhdTrainingCourse {
  return {
    id: 'id',
    referenceId: 'TRN-0000',
    companyId: 'company-1',
    courseKey: 'key',
    title: 'Course',
    description: null,
    category: 'OTHER',
    deliveryMode: 'DOCUMENT',
    durationMinutes: null,
    recurrenceMonths: null,
    requiresEvidence: false,
    externalUrl: null,
    isActive: true,
    isGlobal: false,
    ...overrides,
  };
}

const GLOBAL = course({
  id: 'g1',
  referenceId: 'TRN-0001',
  companyId: null,
  courseKey: 'ca-harassment',
  title: 'CA harassment (global)',
  category: 'HARASSMENT',
  recurrenceMonths: 24,
  isGlobal: true,
});

const COMPANY = course({
  id: 'c1',
  referenceId: 'TRN-0002',
  courseKey: 'orientation',
  title: 'Orientation (company)',
  category: 'ONBOARDING',
  isGlobal: false,
});

/**
 * The global-course read-only test. A `company_id IS NULL` course is
 * platform-owned: a tenant admin may READ and assign it but never edit or retire
 * it. The catalog must hide the edit / retire affordances for `isGlobal` rows —
 * and expose them for company rows — even for a privileged (canManage) admin.
 */
describe('MhdTrainingCatalogPage — global courses are read-only to a tenant admin', () => {
  it('hides Edit / Retire on a global course and shows "Read-only", even with canManage', () => {
    coursesMock.mockReturnValue({ data: [GLOBAL, COMPANY], isLoading: false });

    render(<MhdTrainingCatalogPage companyId="company-1" canManage />);

    const globalRow = screen.getByText('CA harassment (global)').closest('tr') as HTMLElement;
    expect(within(globalRow).queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(within(globalRow).queryByRole('button', { name: 'Retire' })).toBeNull();
    expect(within(globalRow).getByText('Read-only')).toBeInTheDocument();
  });

  it('exposes Edit / Retire on a company course for a privileged admin', () => {
    coursesMock.mockReturnValue({ data: [GLOBAL, COMPANY], isLoading: false });

    render(<MhdTrainingCatalogPage companyId="company-1" canManage />);

    const companyRow = screen.getByText('Orientation (company)').closest('tr') as HTMLElement;
    expect(within(companyRow).getByRole('button', { name: 'Edit' })).toBeInTheDocument();
    expect(within(companyRow).getByRole('button', { name: 'Retire' })).toBeInTheDocument();
  });
});
