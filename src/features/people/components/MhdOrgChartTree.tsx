import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { MhdOrgChartNode } from '@/features/people/Types';

export function mhdBuildOrgChartTree(nodes: MhdOrgChartNode[]): MhdOrgChartNode[] {
  const byId = new Map<string, MhdOrgChartNode>();

  nodes.forEach((node) => {
    byId.set(node.personId, { ...node, children: [] });
  });

  const roots: MhdOrgChartNode[] = [];

  byId.forEach((node) => {
    if (node.managerId && byId.has(node.managerId)) {
      byId.get(node.managerId)!.children.push(node);
      return;
    }
    roots.push(node);
  });

  return roots;
}

interface MhdOrgChartTreeProps {
  nodes: MhdOrgChartNode[];
}

export function MhdOrgChartTree({ nodes }: MhdOrgChartTreeProps) {
  const roots = useMemo(() => mhdBuildOrgChartTree(nodes), [nodes]);
  const [expandedById, setExpandedById] = useState<Record<string, boolean>>({});

  if (roots.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {roots.map((node) => (
        <MhdOrgChartTreeNode
          key={node.personId}
          node={node}
          depth={0}
          expandedById={expandedById}
          onToggle={(personId, expanded) =>
            setExpandedById((current) => ({ ...current, [personId]: expanded }))
          }
        />
      ))}
    </div>
  );
}

interface MhdOrgChartTreeNodeProps {
  node: MhdOrgChartNode;
  depth: number;
  expandedById: Record<string, boolean>;
  onToggle: (personId: string, expanded: boolean) => void;
}

function MhdOrgChartTreeNode({
  node,
  depth,
  expandedById,
  onToggle,
}: MhdOrgChartTreeNodeProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedById[node.personId] ?? depth < 2;

  return (
    <div>
      <div
        className="flex min-h-10 items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
        style={{ marginLeft: `${depth * 1.25}rem` }}
      >
        <button
          type="button"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default disabled:opacity-30"
          aria-label={isExpanded ? `Collapse ${node.displayName}` : `Expand ${node.displayName}`}
          aria-expanded={hasChildren ? isExpanded : undefined}
          disabled={!hasChildren}
          onClick={() => onToggle(node.personId, !isExpanded)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden />
            )
          ) : (
            <span className="h-4 w-4" aria-hidden />
          )}
        </button>
        <Link
          to={`/people/${node.personId}`}
          className="min-w-0 font-medium text-accent-hover hover:underline"
        >
          {node.displayName}
        </Link>
        {node.jobTitle ? (
          <span className="min-w-0 truncate text-muted-foreground">{node.jobTitle}</span>
        ) : null}
      </div>
      {hasChildren && isExpanded ? (
        <div className="space-y-1">
          {node.children.map((child) => (
            <MhdOrgChartTreeNode
              key={child.personId}
              node={child}
              depth={depth + 1}
              expandedById={expandedById}
              onToggle={onToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
