import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { mhdNavTrailBefore } from '../mhdNavTrail';

export interface MhdBreadcrumbItem {
  label: string;
  to?: string;
}

interface Props {
  items: MhdBreadcrumbItem[];
}

/**
 * A page's own trail (`People › Jordan Reyes`) is prefixed with the nav
 * category the leading module belongs to, so every record page also links back
 * to its category landing page — the left rail lists categories only.
 */
export function MhdBreadcrumb({ items }: Props) {
  const lead = items[0]?.to;
  const trail = lead ? [...mhdNavTrailBefore(lead), ...items] : items;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-neutral-500">
      {trail.map((item, index) => {
        const isLast = index === trail.length - 1;
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
