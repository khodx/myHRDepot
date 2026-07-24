import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface MhdBreadcrumbItem {
  label: string;
  to?: string;
}

interface Props {
  items: MhdBreadcrumbItem[];
}

export function MhdBreadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-neutral-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" />}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="hover:text-neutral-900 hover:underline transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-neutral-900' : ''}>{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
