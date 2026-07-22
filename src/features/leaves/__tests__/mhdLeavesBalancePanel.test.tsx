import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MhdLeaveBalancePanel } from '../components/MhdLeaveBalancePanel';
import type { MhdLeaveBalanceRow, MhdLeaveType } from '../Types';

// The pregnancy-stack acid test, at the render layer. A single leave interval
// designated concurrently against FMLA and PDL has decremented BOTH clocks
// (FMLA → 0, PDL 693 − 480 = 213); CFRA, which the interval did not qualify
// under, is UNTOUCHED and draws a full 480. The panel must show these as three
// independent rows and must NEVER sum them: the sum (0 + 213 + 480 = 693) is
// exactly the figure a single-counter regression would wrongly surface.
function leaveType(overrides: Partial<MhdLeaveType>): MhdLeaveType {
  return {
    id: 'type',
    companyId: null,
    typeKey: 'key',
    typeName: 'Type',
    jurisdiction: 'FEDERAL',
    entitlementHours: 480,
    measurementMethod: 'ROLLING_BACKWARD',
    measurementMonths: 12,
    requiresCertification: true,
    citation: null,
    isGlobal: true,
    ...overrides,
  };
}

const acidTestRows: MhdLeaveBalanceRow[] = [
  {
    leaveType: leaveType({ id: 'fmla', typeKey: 'fmla', typeName: 'FMLA', entitlementHours: 480 }),
    remainingHours: 0,
  },
  {
    leaveType: leaveType({
      id: 'pdl',
      typeKey: 'pdl',
      typeName: 'PDL',
      jurisdiction: 'CA',
      entitlementHours: 693,
    }),
    remainingHours: 213,
  },
  {
    leaveType: leaveType({
      id: 'cfra',
      typeKey: 'cfra',
      typeName: 'CFRA',
      jurisdiction: 'CA',
      entitlementHours: 480,
    }),
    remainingHours: 480,
  },
];

describe('MhdLeaveBalancePanel — one row per legal basis, never a sum', () => {
  it('renders exactly one row per designated basis', () => {
    render(<MhdLeaveBalancePanel rows={acidTestRows} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('FMLA')).toBeInTheDocument();
    expect(screen.getByText('PDL')).toBeInTheDocument();
    expect(screen.getByText('CFRA')).toBeInTheDocument();
  });

  it('shows each basis its own remaining balance — two decremented, the third whole', () => {
    render(<MhdLeaveBalancePanel rows={acidTestRows} />);

    const fmlaRow = screen.getByText('FMLA').closest('li') as HTMLElement;
    const pdlRow = screen.getByText('PDL').closest('li') as HTMLElement;
    const cfraRow = screen.getByText('CFRA').closest('li') as HTMLElement;

    // FMLA and PDL were both moved by the one concurrent designation.
    expect(within(fmlaRow).getByText('0 h (~0 wk)')).toBeInTheDocument();
    expect(within(pdlRow).getByText('213 h (~5.3 wk)')).toBeInTheDocument();
    // CFRA, which the interval did not qualify under, is left whole at a full 480.
    expect(within(cfraRow).getByText('480 h (~12 wk)')).toBeInTheDocument();
  });

  it('never renders a summed "total" row — the sum would erase the concurrency model', () => {
    render(<MhdLeaveBalancePanel rows={acidTestRows} />);

    // No total/aggregate label anywhere.
    expect(screen.queryByText(/total/i)).not.toBeInTheDocument();
    // The "remaining" label appears once per basis and no more — a summed row
    // would add a fourth.
    expect(screen.getAllByText('remaining')).toHaveLength(3);
    // The sum of the three remainders (693) must not appear as a remaining
    // figure. (693 legitimately appears as PDL's entitlement, so scope the
    // assertion to the value the panel prints for a balance.)
    expect(screen.queryByText('693 h (~17.3 wk)')).not.toBeInTheDocument();
  });
});
