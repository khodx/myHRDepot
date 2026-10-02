import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MhdDocumentTemplateList } from '../components/MhdDocumentTemplateList';
import type { MhdDocumentTemplate } from '../Types';

const id = () => crypto.randomUUID();
const templates: MhdDocumentTemplate[] = [
  {
    id: id(),
    referenceId: 'DOCT-platform',
    companyId: null,
    name: 'Platform Letter',
    templateType: 'REPORT',
    applicableEntityType: null,
    templateKey: null,
    description: null,
    contentFormat: 'MARKDOWN',
    mergeFields: [],
    version: 2,
    isActive: true,
    requiresSignature: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: id(),
    referenceId: 'DOCT-company',
    companyId: id(),
    name: 'Company Letter',
    templateType: 'REPORT',
    applicableEntityType: null,
    templateKey: null,
    description: null,
    contentFormat: 'MARKDOWN',
    mergeFields: [],
    version: 1,
    isActive: true,
    requiresSignature: false,
    createdAt: '',
    updatedAt: '',
  },
];

describe('MhdDocumentTemplateList', () => {
  it('shows history when provided and customizes only platform rows when allowed', () => {
    const onCustomize = vi.fn();
    const onHistory = vi.fn();
    render(
      <MhdDocumentTemplateList
        templates={[...templates]}
        canMutate
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canCustomize
        onCustomize={onCustomize}
        onHistory={onHistory}
      />,
    );
    expect(screen.getAllByRole('button', { name: 'Version History' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Customize For My Company' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Customize For My Company' }));
    expect(onCustomize).toHaveBeenCalledWith(templates[0].id);
  });

  it('keeps Edit and Delete available and omits customization when not allowed', () => {
    render(
      <MhdDocumentTemplateList
        templates={[...templates]}
        canMutate
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        canCustomize={false}
      />,
    );
    expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: 'Customize For My Company' }),
    ).not.toBeInTheDocument();
  });
});
