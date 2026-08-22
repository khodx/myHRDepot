import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdMultiSelectCombobox } from '@/components/ui/MhdMultiSelectCombobox';
import {
  MHD_CC_ENTITY_TYPES,
  MHD_CC_STATUS_CATEGORIES,
  type MhdCommandCenterFilters,
  type MhdCommandCenterScope,
} from '../Types';

interface Props {
  filters: MhdCommandCenterFilters;
  onChange: (filters: MhdCommandCenterFilters) => void;
  canSeeCompanyScope: boolean;
}

export function MhdCommandCenterFilterBar({ filters, onChange, canSeeCompanyScope }: Props) {
  function update(patch: Partial<MhdCommandCenterFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <MhdFilterBar onClear={() => onChange({ scope: filters.scope ?? 'downline' })}>
      <MhdFilterInput
        type="search"
        label="Search"
        value={filters.searchText ?? ''}
        onChange={(event) => update({ searchText: event.target.value })}
        placeholder="Title or reference"
      />

      <label className="flex min-w-0 flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Entity type
        </span>
        <MhdMultiSelectCombobox
          options={MHD_CC_ENTITY_TYPES.map((option) => ({ id: option.value, label: option.label }))}
          value={filters.entityTypes ?? []}
          onChange={(value) => update({ entityTypes: value as MhdCommandCenterFilters['entityTypes'] })}
          placeholder="All entity types"
        />
      </label>

      <label className="flex min-w-0 flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </span>
        <MhdMultiSelectCombobox
          options={MHD_CC_STATUS_CATEGORIES.map((option) => ({ id: option.value, label: option.label }))}
          value={filters.statusCategories ?? []}
          onChange={(value) => update({ statusCategories: value as MhdCommandCenterFilters['statusCategories'] })}
          placeholder="All statuses"
        />
      </label>

      {canSeeCompanyScope ? (
        <MhdFilterSelect
          label="Scope"
          value={filters.scope ?? 'downline'}
          onChange={(event) => update({ scope: event.target.value as MhdCommandCenterScope })}
        >
          <option value="mine">Mine</option>
          <option value="downline">My Team</option>
          <option value="company">Company</option>
        </MhdFilterSelect>
      ) : null}

      <MhdFilterInput
        type="date"
        label="From"
        value={filters.dateFrom ?? ''}
        onChange={(event) => update({ dateFrom: event.target.value })}
      />
      <MhdFilterInput
        type="date"
        label="To"
        value={filters.dateTo ?? ''}
        onChange={(event) => update({ dateTo: event.target.value })}
      />
      <label className="flex items-center gap-2 self-end pb-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={filters.alertOnly ?? false}
          onChange={(event) => update({ alertOnly: event.target.checked })}
          className="h-4 w-4 rounded"
        />
        Alerts only
      </label>
    </MhdFilterBar>
  );
}
