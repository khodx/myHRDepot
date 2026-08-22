import { AlertTriangle, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useMhdAuth } from '@/features/authentication/Hook';
import { mhdCanMutateActivities } from '@/appshell/mhdRouteAccess';
import { Button } from '@/components/ui/Button';
import { mhdFormatStatusCategory, MHD_CC_ENTITY_LINK_BUILDERS, MHD_CC_ENTITY_TYPES, type MhdCommandCenterEntityType, type MhdCommandCenterFilters, type MhdCommandCenterItem, type MhdCommandCenterStatusCategory } from '../Types';
import { useMhdCommandCenterList } from '../Hook';
import { MhdCommandCenterFilterBar } from './MhdCommandCenterFilterBar';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { MhdCommandCenterLogActivityModal } from './MhdCommandCenterLogActivityModal';

const COMMAND_CENTER_SCOPE_ROLES = ['Platform Admin', 'HR Partner', 'Client Admin'] as const;
const STATUS_VARIANTS: Record<string, MhdBadgeVariant> = {
  OPEN: 'info',
  IN_PROGRESS: 'accent',
  ON_HOLD: 'warning',
  PENDING_REVIEW: 'warning',
  COMPLETE: 'success',
  CANCELLED: 'neutral',
  WITHDRAWN: 'neutral',
};

function entityLabel(entityType: string) {
  return MHD_CC_ENTITY_TYPES.find((option) => option.value === entityType)?.label ?? entityType;
}

function dateLabel(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function itemLink(item: MhdCommandCenterItem): string | null {
  if (item.isSensitiveCategoryOnly) return null;
  if (item.linkPath) return item.linkPath;
  return MHD_CC_ENTITY_LINK_BUILDERS[item.entityType as MhdCommandCenterEntityType]?.(
    item.entityId,
    item,
  ) ?? null;
}

export function MhdCommandCenterPage() {
  const { profile, roles } = useMhdAuth();
  const queryClient = useQueryClient();
  const [isLogActivityOpen, setIsLogActivityOpen] = useState(false);
  const [filters, setFilters] = useState<MhdCommandCenterFilters>({ scope: 'downline' });
  const canSeeCompanyScope = COMMAND_CENTER_SCOPE_ROLES.some((role) => roles.includes(role));
  const canMutateActivities = mhdCanMutateActivities(roles);
  const query = useMhdCommandCenterList(filters);
  const items = query.data ?? [];

  function handleActivityCreated() {
    void queryClient.invalidateQueries({ queryKey: ['command-center', 'list'] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <MhdCommandCenterFilterBar
            filters={filters}
            onChange={setFilters}
            canSeeCompanyScope={canSeeCompanyScope}
          />
        </div>
        {canMutateActivities && profile?.companyId ? (
          <Button onClick={() => setIsLogActivityOpen(true)} className="shrink-0 gap-1.5">
            <Plus className="h-4 w-4" />
            Log Activity
          </Button>
        ) : null}
      </div>
      {profile?.companyId && profile.userId ? (
        <MhdCommandCenterLogActivityModal
          open={isLogActivityOpen}
          onClose={() => setIsLogActivityOpen(false)}
          companyId={profile.companyId}
          currentUserId={profile.userId}
          onCreated={handleActivityCreated}
        />
      ) : null}
      {query.isLoading ? <MhdCard className="p-6 text-sm text-muted-foreground">Loading command center...</MhdCard> : null}
      {!query.isLoading && items.length === 0 ? (
        <MhdCard><MhdEmptyState title="No command center items" description="No records match the current filters." /></MhdCard>
      ) : null}
      {items.length > 0 ? (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead><tr><MhdTh>Type</MhdTh><MhdTh>Title</MhdTh><MhdTh>Status</MhdTh><MhdTh>Alert</MhdTh><MhdTh>Person</MhdTh><MhdTh>Date</MhdTh></tr></thead>
            <tbody>
              {items.map((item) => {
                const to = itemLink(item);
                return <MhdTr key={item.itemId} to={to ?? undefined}>
                  <MhdTd>{entityLabel(item.entityType)}</MhdTd>
                  <MhdTd><div className="font-semibold">{item.title}</div><div className="text-xs text-muted-foreground">{item.referenceId}</div></MhdTd>
                  <MhdTd><MhdBadge variant={STATUS_VARIANTS[item.statusCategory] ?? 'neutral'} hideIcon>{mhdFormatStatusCategory(item.statusCategory as MhdCommandCenterStatusCategory)}</MhdBadge></MhdTd>
                  <MhdTd>{item.isAlert ? <AlertTriangle className="h-4 w-4 text-amber-600" aria-label="Alert" /> : <span className="text-muted-foreground">—</span>}</MhdTd>
                  <MhdTd>{item.personName}</MhdTd>
                  <MhdTd className="whitespace-nowrap">{dateLabel(item.primaryDate)}</MhdTd>
                </MhdTr>;
              })}
            </tbody>
          </MhdTable>
        </MhdCard>
      ) : null}
    </div>
  );
}
