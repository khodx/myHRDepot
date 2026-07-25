import { Bot, CheckCircle2, Workflow, XCircle } from 'lucide-react';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTableFooter, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';

const ENGINE_INVENTORY = [
  {
    capability: 'Workflow State Transitions',
    status: 'Present',
    evidence: 'Task workflow services and transition UI exist.',
  },
  {
    capability: 'Notification Delivery',
    status: 'Present',
    evidence: 'Notifications table and list/read/unread RPCs exist.',
  },
  {
    capability: 'Form Logic Rules',
    status: 'Present',
    evidence: 'Form logic rule structures and editor exist.',
  },
  {
    capability: 'Automation Rules',
    status: 'Missing',
    evidence: 'No automation tables, rule service, scheduler, or execution queue found.',
  },
  {
    capability: 'Automation Runs',
    status: 'Missing',
    evidence: 'No run history, retry, queue, or trigger execution service found.',
  },
] as const;

export function MhdAutomationsPage() {
  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Automations"
        description="Automation planning surface for rules, triggers, actions, and execution history."
      />

      <MhdCard className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-accent-tint p-3 text-accent">
            <Bot className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Automation Engine Required</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The project has workflow, notification, and form-logic components that automations can
              use, but I did not find a true automation engine. To make this module live, the app
              needs automation rule storage, trigger definitions, action dispatch, execution queue,
              run history, retry/failure handling, and role/audit controls.
            </p>
          </div>
        </div>
      </MhdCard>

      <div className="grid gap-4 md:grid-cols-3">
        {['Rule Builder', 'Trigger Library', 'Run History'].map((label) => (
          <MhdCard key={label} className="border-dashed p-5">
            <Workflow className="h-5 w-5 text-accent" aria-hidden />
            <h3 className="mt-3 text-base font-semibold text-foreground">{label}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Designed Shell Only Until The Automation Engine Exists.
            </p>
          </MhdCard>
        ))}
      </div>

      <MhdCard className="overflow-hidden p-0">
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>Capability</MhdTh>
              <MhdTh>Status</MhdTh>
              <MhdTh>Assessment</MhdTh>
            </tr>
          </thead>
          <tbody>
            {ENGINE_INVENTORY.map((item) => (
              <MhdTr key={item.capability}>
                <MhdTd className="font-semibold">{item.capability}</MhdTd>
                <MhdTd>
                  <span className="inline-flex items-center gap-1.5">
                    {item.status === 'Present' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" aria-hidden />
                    )}
                    {item.status}
                  </span>
                </MhdTd>
                <MhdTd className="text-muted-foreground">{item.evidence}</MhdTd>
              </MhdTr>
            ))}
          </tbody>
        </MhdTable>
        <MhdTableFooter summary="Showing 1 To 5 Of 5 Automation Capabilities" />
      </MhdCard>
    </div>
  );
}
