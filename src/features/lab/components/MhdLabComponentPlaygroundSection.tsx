import { MhdFilterBar, MhdFilterInput, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { buttonBaseClasses, buttonVariantClasses, type ButtonVariant } from '@/components/ui/buttonStyles';
import { cn } from '@/utils/cn';

const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'destructive', 'warning'];

/**
 * Renders shared UI primitives in isolation for design review — buttons,
 * page header, filter bar, and table row conventions. Purely presentational,
 * reads no data, and never sends a request.
 */
export function MhdLabComponentPlaygroundSection() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-foreground">Buttons</h3>
        <div className="flex flex-wrap gap-2">
          {BUTTON_VARIANTS.map((variant) => (
            <button key={variant} type="button" className={cn(buttonBaseClasses, buttonVariantClasses[variant])}>
              {variant.charAt(0).toUpperCase() + variant.slice(1)} Action
            </button>
          ))}
          <button type="button" disabled className={cn(buttonBaseClasses, buttonVariantClasses.primary)}>
            Disabled
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-foreground">Page Header</h3>
        <div className="rounded-md border border-dashed border-border p-4">
          <MhdPageHeader
            title="Sample Record"
            description="A one-line purpose statement rendered under the title."
            actions={
              <button type="button" className={cn(buttonBaseClasses, buttonVariantClasses.primary)}>
                New Item
              </button>
            }
          />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-foreground">Filter Bar</h3>
        <MhdFilterBar>
          <MhdFilterInput label="Search" placeholder="Search…" value="" onChange={() => {}} />
          <MhdFilterSelect label="Status" value="ALL" onChange={() => {}}>
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
          </MhdFilterSelect>
        </MhdFilterBar>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-foreground">Table Row Convention</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {['Sample Row One', 'Sample Row Two'].map((name) => (
                <tr key={name} className="border-b border-border/60">
                  <td className="py-2 pr-4">{name}</td>
                  <td className="py-2 pr-4">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      Active
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button type="button" className="text-sm font-medium text-accent hover:text-accent-hover">
                        View
                      </button>
                      <button type="button" className="text-sm font-medium text-accent hover:text-accent-hover">
                        Edit
                      </button>
                      <button type="button" className="text-sm font-medium text-red-700 hover:text-red-800">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
