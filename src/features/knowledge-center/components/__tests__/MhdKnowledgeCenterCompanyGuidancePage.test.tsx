import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdKnowledgeCenterCompanyGuidancePage } from '../MhdKnowledgeCenterCompanyGuidancePage';

const authState = vi.hoisted(() => ({
  current: {
    profile: { companyId: 'company-1' as string | null, companyName: 'Acme' as string | null },
  },
}));

vi.mock('@/features/authentication/Hook', () => ({
  useMhdAuth: () => authState.current,
}));
vi.mock('../MhdKbArticleManager', () => ({
  MhdKbArticleManager: (props: { scope: string; companyId: string | null }) => (
    <div data-testid="manager">
      {props.scope}:{props.companyId}
    </div>
  ),
}));

describe('MhdKnowledgeCenterCompanyGuidancePage', () => {
  it('renders company guidance for the profile company', () => {
    render(<MhdKnowledgeCenterCompanyGuidancePage />);
    expect(screen.getByText('Company Guidance')).toBeInTheDocument();
    expect(
      screen.getByText('Articles and FAQs written for the people at Acme.'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('manager')).toHaveTextContent('COMPANY:company-1');
  });

  it('renders only the no-company message without a manager', () => {
    authState.current = { profile: { companyId: null, companyName: null } };
    render(<MhdKnowledgeCenterCompanyGuidancePage />);
    expect(screen.getByText('No company is associated with your profile.')).toBeInTheDocument();
    expect(screen.queryByTestId('manager')).not.toBeInTheDocument();
  });
});
