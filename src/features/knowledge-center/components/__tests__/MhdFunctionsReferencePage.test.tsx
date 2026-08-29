import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MhdKbFunction, MhdKbFunctionListItem } from '../../Types';
const { listRef, detailRef } = vi.hoisted(() => ({
  listRef: {
    current: {
      data: { items: [] as MhdKbFunctionListItem[], totalCount: 0 },
      isLoading: false,
      error: null as Error | null,
    },
  },
  detailRef: { current: { data: null as MhdKbFunction | null, isLoading: false } },
}));
vi.mock('../../Hook', () => ({
  useMhdKbFunctionsPublic: () => listRef.current,
  useMhdKbFunctionPublic: () => detailRef.current,
}));
import { MhdFunctionsReferencePage } from '../MhdFunctionsReferencePage';
const fn = {
  id: 'f-1',
  name: 'SUM',
  category: 'Math',
  syntax: 'SUM(a,b)',
  relatedEngine: 'calculator',
  isDeprecated: false,
};
const detail = { ...fn, description: 'Adds values', exampleInput: 'SUM(1, 2)', exampleOutput: '3' };
beforeEach(() => {
  vi.clearAllMocks();
  listRef.current = { data: { items: [fn], totalCount: 1 }, isLoading: false, error: null };
  detailRef.current = { data: detail, isLoading: false };
});
describe('MhdFunctionsReferencePage', () => {
  it('renders the functions table', () => {
    render(
      <MemoryRouter>
        <MhdFunctionsReferencePage />
      </MemoryRouter>,
    );
    expect(screen.getByText('SUM')).toBeInTheDocument();
    expect(screen.getByText('SUM(a,b)')).toBeInTheDocument();
  });
  it('opens a detail modal when a row is clicked', () => {
    render(
      <MemoryRouter>
        <MhdFunctionsReferencePage />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText('SUM'));
    expect(screen.getByText('Adds values')).toBeInTheDocument();
    expect(screen.getByText('SUM(1, 2)')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
