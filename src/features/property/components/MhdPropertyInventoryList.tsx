import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import type { MhdPropertyItem } from '../Types';
import { MhdPropertyStatusBadge } from './MhdPropertyStatusBadge';

interface MhdPropertyInventoryListProps {
  items: MhdPropertyItem[];
  isLoading: boolean;
  canMutate: boolean;
}

export function MhdPropertyInventoryList({ items, isLoading, canMutate }: MhdPropertyInventoryListProps) {
  if (isLoading) {
    return <MhdCard className="p-6 text-sm text-muted-foreground">Loading property inventory...</MhdCard>;
  }

  if (items.length === 0) {
    return (
      <MhdCard className="border-dashed">
        <MhdEmptyState icon={Package} title="No property items found" description="No property items match the current filters." />
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
            <MhdTh>Action</MhdTh>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <MhdTr key={item.id} className="align-top">
              <MhdTd>
                <div className="font-medium text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.referenceId}</div>
                {item.serialNumber ? <div className="mt-1 text-xs text-muted-foreground">S/N: {item.serialNumber}</div> : null}
              </MhdTd>
              <MhdTd>{item.category}</MhdTd>
              <MhdTd>
                {item.quantityAvailable} / {item.quantityTotal}
              </MhdTd>
              <MhdTd>
                <MhdPropertyStatusBadge status={item.status} />
              </MhdTd>
              <MhdTd>
                <Link to={`/property/${item.id}`} className="font-semibold text-accent hover:text-accent-hover">
                  {canMutate ? 'Manage' : 'View'}
                </Link>
              </MhdTd>
            </MhdTr>
          ))}
        </tbody>
      </MhdTable>
    </MhdCard>
  );
}
