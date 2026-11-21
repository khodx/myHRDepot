import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdLeaveDesignatedPersonPanel } from '../components/MhdLeaveDesignatedPersonPanel';
import type { MhdLeaveDesignatedPerson } from '../WorkflowTypes';

const CASE_ID = '7d24c9e1-0b5a-4f83-9c16-e2a8b4f07d51';

const active: MhdLeaveDesignatedPerson = {
  id: 'designation-1',
  designated_name: 'Teresa Villanueva',
  relationship_note: 'Lifelong family friend who shares the household',
  designated_at: '2026-08-04T16:20:00Z',
  pfl_attested_on: null,
  voided_at: null,
  void_reason: null,
};

const voided: MhdLeaveDesignatedPerson = {
  ...active,
  id: 'designation-0',
  designated_name: 'Marcus Delacroix',
  voided_at: '2026-08-02T10:00:00Z',
  void_reason: 'Named on the wrong case',
};

function renderPanel({
  persons = [active, voided],
  privileged = true,
  limitDesignatedPerson = false,
  onRecord = vi.fn<(input: unknown) => Promise<boolean>>().mockResolvedValue(true),
  onVoid = vi.fn<(input: unknown) => Promise<boolean>>().mockResolvedValue(true),
} = {}) {
  render(
    <MhdLeaveDesignatedPersonPanel
      caseId={CASE_ID}
      persons={persons}
      familyRelationship="DESIGNATED_PERSON"
      limitDesignatedPerson={limitDesignatedPerson}
      privileged={privileged}
      onRecord={onRecord}
      onVoid={onVoid}
      isPending={false}
    />,
  );
  return { onRecord, onVoid };
}

describe('MhdLeaveDesignatedPersonPanel', () => {
  it('shows recorded persons with their dates and voided state, read-only for an employee', () => {
    renderPanel({ privileged: false });
    expect(screen.getByText('Teresa Villanueva')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Voided', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText(/Named on the wrong case/)).toBeInTheDocument();
    expect(screen.getByText('Designated Person', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('says so when no one is designated and explains an elected company limit', () => {
    renderPanel({ persons: [], limitDesignatedPerson: true, privileged: false });
    expect(screen.getByText('No designated person recorded.')).toBeInTheDocument();
    expect(screen.getByText(/one designated person in a 12-month period/)).toBeInTheDocument();
  });

  it('records a designated person with the PFL attestation date', async () => {
    const { onRecord } = renderPanel({ persons: [] });
    expect(
      screen.getByText('Required for Paid Family Leave claims filed on or after July 1, 2028.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record Designated Person' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Designated person name'), {
      target: { value: 'Teresa Villanueva' },
    });
    fireEvent.change(screen.getByLabelText('Relationship note'), {
      target: { value: 'Shares the household' },
    });
    fireEvent.change(screen.getByLabelText('PFL Attestation Date'), {
      target: { value: '08/04/2026' },
    });
    fireEvent.blur(screen.getByLabelText('PFL Attestation Date'));
    fireEvent.click(screen.getByRole('button', { name: 'Record Designated Person' }));
    await waitFor(() =>
      expect(onRecord).toHaveBeenCalledWith({
        caseId: CASE_ID,
        designatedName: 'Teresa Villanueva',
        relationshipNote: 'Shares the household',
        pflAttestedOn: '2026-08-04',
      }),
    );
    await waitFor(() => expect(screen.getByLabelText('Designated person name')).toHaveValue(''));
  });

  it('voids an active designation only with a reason', async () => {
    const { onVoid } = renderPanel();
    expect(screen.getAllByRole('button', { name: 'Void Designation' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Void Designation' }));
    expect(screen.getByRole('button', { name: 'Confirm Void' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Void reason'), {
      target: { value: 'Employee chose a different person' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Void' }));
    await waitFor(() =>
      expect(onVoid).toHaveBeenCalledWith({
        designatedPersonId: 'designation-1',
        reason: 'Employee chose a different person',
      }),
    );
  });
});
