import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import type { MhdPropertyItem } from '../Types';
import { MhdPropertyStatusBadge } from './MhdPropertyStatusBadge';

interface MhdPropertyInventoryListProps {
  items: MhdPropertyItem[];
  isLoading: boolean;
  canMutate: boolean;
}

export function MhdPropertyInventoryList({ items, isLoading, canMutate }: MhdPropertyInventoryListProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading property inventory...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-slate-400 shadow-sm">
        <Package className="mb-3 h-10 w-10" />
        <p className="text-sm font-medium text-slate-600">No property items match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-slate-500">
            <th className="px-4 py-3 font-semibold">Item</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Available</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} className="align-top">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{item.name}</div>
                <div className="text-xs text-slate-500">{item.referenceId}</div>
                {item.serialNumber ? <div className="mt-1 text-xs text-slate-500">S/N: {item.serialNumber}</div> : null}
              </td>
              <td className="px-4 py-3 text-slate-700">{item.category}</td>
              <td className="px-4 py-3 text-slate-700">
                {item.quantityAvailable} / {item.quantityTotal}
              </td>
              <td className="px-4 py-3">
                <MhdPropertyStatusBadge status={item.status} />
              </td>
              <td className="px-4 py-3">
                <Link to={`/property/${item.id}`} className="font-semibold text-blue-700 hover:underline">
                  {canMutate ? 'Manage' : 'View'}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
