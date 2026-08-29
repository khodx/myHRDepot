import { useState } from 'react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import {
  mhdPaginationSummary,
  MhdPaginationControls,
  useMhdPagination,
} from '@/components/ui/MhdPagination';
import { MhdTable, MhdTableFooter, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdKbFunctionPublic, useMhdKbFunctionsPublic } from '../Hook';
export function MhdFunctionsReferencePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [relatedEngine, setRelatedEngine] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const functions = useMhdKbFunctionsPublic({
    searchTerm,
    relatedEngine: relatedEngine || undefined,
  });
  const detail = useMhdKbFunctionPublic(selectedId);
  const items = functions.data?.items ?? [];
  const pagination = useMhdPagination(items.length, { resetKey: `${searchTerm}:${relatedEngine}` });
  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Functions & Formulas Reference"
        description="Reference formulas and functions available across My HR Depot."
      />
      <MhdFilterBar>
        <MhdFilterInput
          label="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search functions"
        />
        <MhdFilterSelect
          label="Related engine"
          value={relatedEngine}
          onChange={(e) => setRelatedEngine(e.target.value)}
        >
          <option value="">All engines</option>
          <option value="calculator">Calculator</option>
          <option value="automation">Automation</option>
          <option value="forms">Forms</option>
        </MhdFilterSelect>
      </MhdFilterBar>
      {functions.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading functions…</p>
      ) : functions.error ? (
        <p role="alert" className="text-sm text-rose-600">
          {functions.error instanceof Error ? functions.error.message : 'Unable to load functions.'}
        </p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Name</MhdTh>
                <MhdTh>Category</MhdTh>
                <MhdTh>Syntax</MhdTh>
                <MhdTh>Engine</MhdTh>
              </tr>
            </thead>
            <tbody>
              {pagination.sliceItems(items).map((item) => (
                <MhdTr key={item.id} onClick={() => setSelectedId(item.id)}>
                  <MhdTd className="font-medium">{item.name}</MhdTd>
                  <MhdTd>{item.category}</MhdTd>
                  <MhdTd className="font-mono text-xs">{item.syntax}</MhdTd>
                  <MhdTd>{item.relatedEngine}</MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
          <MhdTableFooter summary={mhdPaginationSummary(pagination, items.length, 'functions')}>
            <MhdPaginationControls pagination={pagination} />
          </MhdTableFooter>
        </MhdCard>
      )}
      {selectedId ? (
        <MhdModal
          title={detail.data?.name ?? 'Function detail'}
          onClose={() => setSelectedId(null)}
        >
          {detail.isLoading ? (
            <p>Loading…</p>
          ) : detail.data ? (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">{detail.data.description}</p>
              <div>
                <h3 className="font-semibold">Example input</h3>
                <pre className="mt-1 whitespace-pre-wrap rounded bg-muted p-3">
                  {detail.data.exampleInput || '—'}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold">Example output</h3>
                <pre className="mt-1 whitespace-pre-wrap rounded bg-muted p-3">
                  {detail.data.exampleOutput || '—'}
                </pre>
              </div>
            </div>
          ) : (
            <p role="alert">Function not found.</p>
          )}
        </MhdModal>
      ) : null}
    </div>
  );
}
