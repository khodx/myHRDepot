import { Link, useLocation } from 'react-router-dom';
import { CheckSquare, FileSearch, FileText } from 'lucide-react';
import { buttonBaseClasses, buttonVariantClasses } from '@/components/ui/buttonStyles';
import { useMhdAuth } from '@/features/authentication/Hook';
import { cn } from '@/utils/cn';
import { MHD_AUDIT_REPORTS_LINK_ROLES } from './MhdTaskWorkspaceNavConstants';

interface MhdTaskWorkspaceNavItem {
  key: string;
  label: string;
  to: string;
  icon: typeof CheckSquare;
}

/**
 * Persistent nav bar across the three sibling top-level routes that make up
 * the task workspace: /tasks, /reports, /audit-reports. These are plain
 * sibling <Route> entries in AppRouter.tsx with no shared parent/layout
 * route, so each page fully unmounts on navigation between them — active
 * state can't live in page-local component state (see the dead
 * isReportsActive/isAuditReportsActive state this replaces in
 * MhdTasksPage). This component is rendered independently on all three pages
 * instead, computing active state from the current pathname each time it
 * mounts, the same way MhdTaskRecordTabs shows which task-detail tab is
 * active.
 *
 * /reports is the generic, module-wide Reports/Templates page shared by
 * every module (Leaves, Accommodations, Employee Files, Tasks, etc.), not
 * task-specific — this nav bar appearing there is an accepted tradeoff,
 * confirmed with the user, not an oversight.
 */
export function MhdTaskWorkspaceNav() {
  const location = useLocation();
  const { roles } = useMhdAuth();
  const canViewAuditReports = MHD_AUDIT_REPORTS_LINK_ROLES.some((role) => roles.includes(role));

  const items: MhdTaskWorkspaceNavItem[] = [
    { key: 'tasks', label: 'Tasks', to: '/tasks', icon: CheckSquare },
    { key: 'reports', label: 'Task Reports', to: '/reports', icon: FileText },
    ...(canViewAuditReports
      ? [{ key: 'audit-reports', label: 'Audit Reports', to: '/audit-reports', icon: FileSearch }]
      : []),
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const isActive = location.pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            to={item.to}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              buttonBaseClasses,
              isActive ? buttonVariantClasses.primary : buttonVariantClasses.secondary,
              'h-9 gap-1.5 px-3 text-[16.8px]',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
