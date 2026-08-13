import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import type { MhdOrgChartNode } from '../Types';
import { MhdOrgChartTree, mhdBuildOrgChartTree } from '../components/MhdOrgChartTree';

function node(
  personId: string,
  displayName: string,
  managerId: string | null,
  jobTitle: string | null = null,
): MhdOrgChartNode {
  return {
    personId,
    referenceId: `PERS-${personId}`,
    displayName,
    jobTitle,
    managerId,
    companyId: 'company-1',
    children: [],
  };
}

function renderTree(nodes: MhdOrgChartNode[]) {
  return render(
    <MemoryRouter>
      <MhdOrgChartTree nodes={nodes} />
    </MemoryRouter>,
  );
}

describe('mhdBuildOrgChartTree', () => {
  it('builds a single root with nested children across at least three levels', () => {
    const roots = mhdBuildOrgChartTree([
      node('person-1', 'Ari Executive', null),
      node('person-2', 'Blair Manager', 'person-1'),
      node('person-3', 'Casey Lead', 'person-2'),
      node('person-4', 'Devon Contributor', 'person-3'),
    ]);

    expect(roots).toHaveLength(1);
    expect(roots[0].displayName).toBe('Ari Executive');
    expect(roots[0].children[0].displayName).toBe('Blair Manager');
    expect(roots[0].children[0].children[0].displayName).toBe('Casey Lead');
    expect(roots[0].children[0].children[0].children[0].displayName).toBe(
      'Devon Contributor',
    );
  });

  it('treats a node with a null manager as a root', () => {
    const roots = mhdBuildOrgChartTree([node('person-1', 'Ari Executive', null)]);

    expect(roots).toEqual([
      expect.objectContaining({
        personId: 'person-1',
        managerId: null,
      }),
    ]);
  });

  it('treats a node whose manager is outside the visible input as a root', () => {
    const roots = mhdBuildOrgChartTree([
      node('person-2', 'Blair Scoped Manager', 'person-outside-scope'),
    ]);

    expect(roots).toHaveLength(1);
    expect(roots[0]).toEqual(
      expect.objectContaining({
        personId: 'person-2',
        managerId: 'person-outside-scope',
      }),
    );
  });

  it('returns a forest for multiple independent roots', () => {
    const roots = mhdBuildOrgChartTree([
      node('person-1', 'Ari Executive', null),
      node('person-2', 'Blair Manager', 'person-1'),
      node('person-3', 'Casey Executive', null),
      node('person-4', 'Devon Manager', 'person-3'),
    ]);

    expect(roots).toHaveLength(2);
    expect(roots.map((root) => root.displayName)).toEqual(['Ari Executive', 'Casey Executive']);
    expect(roots[0].children.map((child) => child.displayName)).toEqual(['Blair Manager']);
    expect(roots[1].children.map((child) => child.displayName)).toEqual(['Devon Manager']);
  });
});

describe('MhdOrgChartTree', () => {
  it('renders depth 0 and 1 expanded by default and leaves deeper descendants collapsed', () => {
    renderTree([
      node('person-1', 'Ari Executive', null),
      node('person-2', 'Blair Manager', 'person-1'),
      node('person-3', 'Casey Lead', 'person-2'),
      node('person-4', 'Devon Contributor', 'person-3'),
    ]);

    expect(screen.getByText('Ari Executive')).toBeInTheDocument();
    expect(screen.getByText('Blair Manager')).toBeInTheDocument();
    expect(screen.getByText('Casey Lead')).toBeInTheDocument();
    expect(screen.queryByText('Devon Contributor')).not.toBeInTheDocument();
  });

  it('reveals and hides children when a node toggle is clicked', () => {
    renderTree([
      node('person-1', 'Ari Executive', null),
      node('person-2', 'Blair Manager', 'person-1'),
      node('person-3', 'Casey Lead', 'person-2'),
      node('person-4', 'Devon Contributor', 'person-3'),
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Expand Casey Lead' }));
    expect(screen.getByText('Devon Contributor')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Collapse Casey Lead' }));
    expect(screen.queryByText('Devon Contributor')).not.toBeInTheDocument();
  });

  it('renders a node name as a link to the person detail page', () => {
    renderTree([node('person-1', 'Ari Executive', null)]);

    expect(screen.getByRole('link', { name: 'Ari Executive' })).toHaveAttribute(
      'href',
      '/people/person-1',
    );
  });

  it('renders a disabled toggle button for leaf nodes', () => {
    renderTree([node('person-1', 'Ari Executive', null)]);

    expect(screen.getByRole('button', { name: 'Collapse Ari Executive' })).toBeDisabled();
  });
});
