import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { useMhdAssistant } from '@/features/assistant/Hook';

export function MhdDashboardAssistantCallout() {
  const { openAssistant } = useMhdAssistant();

  return (
    <MhdCard className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 shrink-0 text-assistant" aria-hidden />
        <p className="text-sm text-foreground">
          Need help finding something or filling out a form? Ask the assistant.
        </p>
      </div>
      <Button onClick={() => openAssistant()}>Ask the assistant</Button>
    </MhdCard>
  );
}
