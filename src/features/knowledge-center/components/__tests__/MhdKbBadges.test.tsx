import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MhdKbBadges } from '../MhdKbBadges';

describe('MhdKbBadges', () => {
  it.each(['PUBLIC', 'COMPANY'] as const)('does not show an access badge for %s', (accessLevel) => {
    render(
      <MhdKbBadges
        articleType="FAQ"
        companyId={accessLevel === 'COMPANY' ? 'company-1' : null}
        accessLevel={accessLevel}
      />,
    );
    expect(screen.getByText('FAQ')).toBeInTheDocument();
    expect(screen.queryByText('Leadership')).not.toBeInTheDocument();
    expect(screen.queryByText('Administrators')).not.toBeInTheDocument();
  });

  it('shows company and elevated access badges when applicable', () => {
    render(<MhdKbBadges articleType="ARTICLE" companyId="company-1" accessLevel="ADMIN" />);
    expect(screen.getByText('Article')).toBeInTheDocument();
    expect(screen.getByText('Your Company')).toBeInTheDocument();
    expect(screen.getByText('Administrators')).toBeInTheDocument();
  });
});
