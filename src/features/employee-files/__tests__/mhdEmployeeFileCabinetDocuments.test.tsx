import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdEmployeeFileDocument } from '@/features/documents/Types';

const PERSON_ID = crypto.randomUUID();
const PERSON_COMPANY_ID = crypto.randomUUID();
const FORM_ID = crypto.randomUUID();

const { getPersonById, listEmployeeFileSubmissions, useEmployeeFileDocuments } = vi.hoisted(() => ({
  getPersonById: vi.fn(),
  listEmployeeFileSubmissions: vi.fn(),
  useEmployeeFileDocuments: vi.fn(),
}));

vi.mock('@/features/people/Service', () => ({
  mhdPersonService: { getPersonById },
}));

vi.mock('@/features/forms/Service', () => ({
  mhdFormService: { listEmployeeFileSubmissions },
}));

vi.mock('@/features/documents/Hook', () => ({
  useMhdEmployeeFileDocuments: useEmployeeFileDocuments,
}));

const { MhdEmployeeFileCabinetPage } = await import('../components/MhdEmployeeFileCabinetPage');

function makeDocument(overrides: Partial<MhdEmployeeFileDocument> = {}): MhdEmployeeFileDocument {
  return {
    id: crypto.randomUUID(),
    referenceId: `DGEN-${crypto.randomUUID()}`,
    templateKey: 'CONDUCT_NOTICE',
    templateName: 'Conduct Notice',
    employeeFileCategory: 'general',
    entityType: 'CONDUCT_ACTION',
    entityId: crypto.randomUUID(),
    status: 'GENERATED',
    outputFormat: 'PDF',
    outputFileName: 'conduct-notice.pdf',
    outputDriveFileId: null,
    esignatureRequestId: null,
    generatedAt: '2026-09-30T17:45:00.000Z',
    createdBy: crypto.randomUUID(),
    createdByName: 'Taylor Morgan',
    createdAt: '2026-09-30T17:44:00.000Z',
    ...overrides,
  };
}

/** The card for one employee file type, found by its heading. */
function cardFor(label: string): HTMLElement {
  const card = screen.getByText(label).closest('.overflow-hidden');
  if (!card) throw new Error(`No card found for ${label}`);
  return card as HTMLElement;
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/employees/${PERSON_ID}/files`]}>
        <Routes>
          <Route path="/employees/:personId/files" element={<MhdEmployeeFileCabinetPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  getPersonById.mockResolvedValue({
    id: PERSON_ID,
    companyId: PERSON_COMPANY_ID,
    displayName: 'Jordan Martinez',
    referenceId: 'EMP-1042',
    companyName: 'Acme HR',
  });
  listEmployeeFileSubmissions.mockResolvedValue([
    {
      id: crypto.randomUUID(),
      formId: FORM_ID,
      formName: 'Employee Handbook Acknowledgment',
      referenceId: 'SUB-1001',
      status: 'SUBMITTED',
      submitterDisplayName: 'Jordan Martinez',
      submittedAt: '2026-09-29T15:30:00.000Z',
      attachmentCount: 0,
      employeeFileCategory: 'general',
      certificateStatus: null,
      certificateDigitallySigned: false,
      certificateVerificationCode: null,
    },
  ]);
  useEmployeeFileDocuments.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  });
});

describe('MhdEmployeeFileCabinetPage generated documents', () => {
  it('shows documents only in their category, with counts and the empty message', async () => {
    const generalDocument = makeDocument({ templateName: 'Conduct Notice' });
    const payrollDocument = makeDocument({
      templateName: 'Payroll Change Letter',
      employeeFileCategory: 'payroll',
      status: 'FAILED',
    });
    useEmployeeFileDocuments.mockReturnValue({
      data: [generalDocument, payrollDocument],
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(await screen.findByText('Conduct Notice')).toBeInTheDocument();
    const generalCard = cardFor('General File');
    const payrollCard = cardFor('Payroll File');
    const benefitsCard = cardFor('Benefits File');

    expect(within(generalCard).getByText('Generated Documents (1)')).toBeInTheDocument();
    expect(within(generalCard).getByText('Conduct Notice')).toBeInTheDocument();
    expect(within(generalCard).queryByText('Payroll Change Letter')).not.toBeInTheDocument();

    expect(within(payrollCard).getByText('Generated Documents (1)')).toBeInTheDocument();
    expect(within(payrollCard).getByText('Payroll Change Letter')).toBeInTheDocument();
    expect(within(payrollCard).queryByText('Conduct Notice')).not.toBeInTheDocument();

    expect(within(benefitsCard).getByText('Generated Documents (0)')).toBeInTheDocument();
    expect(
      within(benefitsCard).getByText('No generated documents in this employee file type.'),
    ).toBeInTheDocument();
    // Every file type except Medical, and except the two holding a document, shows the empty message.
    expect(screen.getAllByText('No generated documents in this employee file type.')).toHaveLength(
      6,
    );
    // The submitted-form table is untouched.
    expect(within(generalCard).getByText('Employee Handbook Acknowledgment')).toBeInTheDocument();
  });

  it('omits generated-document sections for medical files', async () => {
    useEmployeeFileDocuments.mockReturnValue({
      data: [makeDocument({ employeeFileCategory: 'general' })],
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(await screen.findByText('Generated Documents (1)')).toBeInTheDocument();
    expect(cardFor('Medical File')).not.toHaveTextContent('Generated Documents');
    expect(cardFor('General File')).toHaveTextContent('Generated Documents (1)');
  });

  it('shows a Drive link only when a document has a drive file id and marks signed documents', async () => {
    useEmployeeFileDocuments.mockReturnValue({
      data: [
        makeDocument({
          templateName: 'Signed Offer',
          status: 'SIGNED',
          outputDriveFileId: 'drive-file-123',
        }),
        makeDocument({ templateName: 'Pending Offer', status: 'PENDING' }),
      ],
      isLoading: false,
      isError: false,
    });

    renderPage();

    expect(await screen.findByText('Signed Offer')).toBeInTheDocument();
    expect(screen.getByText('Signed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Document' })).toHaveAttribute(
      'href',
      'https://drive.google.com/file/d/drive-file-123/view',
    );
    expect(screen.getByRole('link', { name: 'View Document' })).toHaveAttribute('target', '_blank');
    expect(screen.getByText('Pending Offer')).toBeInTheDocument();
    expect(screen.getAllByText('View Document')).toHaveLength(1);
  });

  it('shows the document load alert while preserving submitted form rows', async () => {
    useEmployeeFileDocuments.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    renderPage();

    // Reported once for the page, not repeated in every file type's card.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Generated documents could not be loaded.',
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(screen.queryByText(/Generated Documents \(/)).not.toBeInTheDocument();
    expect(screen.getByText('Employee Handbook Acknowledgment')).toBeInTheDocument();
    await waitFor(() => expect(useEmployeeFileDocuments).toHaveBeenCalledWith(PERSON_ID));
  });
});
