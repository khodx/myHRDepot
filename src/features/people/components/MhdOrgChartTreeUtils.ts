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
