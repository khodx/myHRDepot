import { MhdEntityAttachmentsPanel } from '@/components/ui/MhdEntityAttachmentsPanel';

interface Props {
  activityId: string;
  readOnly?: boolean;
}

export function MhdActivityAttachmentsPanel({ activityId, readOnly = false }: Props) {
  return (
    <MhdEntityAttachmentsPanel
      entityType="ACTIVITY"
      entityId={activityId}
      subjectLabel="activity"
      readOnly={readOnly}
    />
  );
}
