import { Package } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { mhdPaginationSummary, MhdPaginationControls, useMhdPagination } from '@/components/ui/MhdPagination';
import {
  MhdActionsTh,
  MhdTable,
  MhdTableActions,
  MhdTableFooter,
  MhdTd,
  MhdTh,
  MhdTr,
} from '@/components/ui/MhdTable';
import type { MhdPropertyItem } from '../Types';
import { MhdPropertyStatusBadge } from './MhdPropertyStatusBadge';

interface MhdPropertyInventoryListProps {
  items: MhdPropertyItem[];
  isLoading: boolean;
  canMutate: boolean;
}

export function MhdPropertyInventoryList({
  items,
  isLoading,
  canMutate,
}: MhdPropertyInventoryListProps) {
  const pagination = useMhdPagination(items.length, {
    resetKey: `${items.length}:${items[0]?.id ?? ''}`,
  });

  if (isLoading) {
    return (
      <MhdCard className="p-6 text-sm text-muted-foreground">Loading property inventory...</MhdCard>
    );
  }

  if (items.length === 0) {
    return (
      <MhdCard className="border border-dashed border-border">
        <MhdEmptyState
          icon={Package}
          title="No property items found"
          description="No property items match the current filters."
        />
      </MhdCard>
    );
  }

  return (
    <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh>Item</MhdTh>
            <MhdTh>Category</MhdTh>
            <MhdTh>Available</MhdTh>
            <MhdTh>Status</MhdTh>
            <MhdActionsTh />
          </tr>
        </thead>
        <tbody>
          {pagination.sliceItems(items).map((item) => (
            <MhdTr key={item.id} to={`/property/${item.id}`} className="align-top">
              <MhdTd>
                <div className="font-medium text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.referenceId}</div>
                {item.serialNumber ? (
                  <div className="mt-1 text-xs text-muted-foreground">S/N: {item.serialNumber}</div>
                ) : null}
              </MhdTd>
              <MhdTd>{item.category}</MhdTd>
              <MhdTd>
                {item.quantityAvailable} / {item.quantityTotal}
              </MhdTd>
              <MhdTd>
                <MhdPropertyStatusBadge status={item.status} />
              </MhdTd>
              <MhdTableActions
                viewTo={`/property/${item.id}`}
                editTo={canMutate ? `/property/${item.id}` : undefined}
              />
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>
      <MhdTableFooter summary={mhdPaginationSummary(pagination, items.length, 'property items')}>
        <MhdPaginationControls pagination={pagination} />
      </MhdTableFooter>
    </MhdCard>
  );
}
