import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { mhdDocumentService } from '@/features/documents/Service';
import type {
  MhdDocumentDeliveryChannel,
  MhdDocumentDeliveryStatus,
} from '@/features/documents/Types';

interface MhdRecordDeliveryDialogProps {
  documentGenerationId: string;
  recipientPersonId?: string | null;
  defaultRecipientEmail?: string | null;
  onClose: () => void;
  onRecorded: () => void;
}

export function MhdRecordDeliveryDialog({
  documentGenerationId,
  recipientPersonId,
  defaultRecipientEmail,
  onClose,
  onRecorded,
}: MhdRecordDeliveryDialogProps) {
  const [channel, setChannel] = useState<MhdDocumentDeliveryChannel>('EMAIL');
  const [status, setStatus] = useState<MhdDocumentDeliveryStatus>('PENDING');
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipientEmail ?? '');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMail = channel === 'US_MAIL' || channel === 'CERTIFIED_MAIL';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await mhdDocumentService.recordDelivery({
        documentGenerationId,
        channel,
        status,
        recipientPersonId,
        recipientEmail: recipientEmail || null,
        ...(isMail
          ? { trackingCarrier: trackingCarrier || null, trackingNumber: trackingNumber || null }
          : {}),
      });
      onRecorded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record document delivery.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-semibold text-foreground">Record delivery</h2>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium text-foreground">
              Channel
              <select value={channel} onChange={(event) => setChannel(event.target.value as MhdDocumentDeliveryChannel)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
                <option value="EMAIL">Email</option>
                <option value="US_MAIL">US Mail</option>
                <option value="CERTIFIED_MAIL">Certified Mail</option>
                <option value="HAND_DELIVERED">Hand-Delivered</option>
              </select>
            </label>
            <label className="text-sm font-medium text-foreground">
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value as MhdDocumentDeliveryStatus)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm">
                <option value="PENDING">Pending</option>
                <option value="SENT">Sent</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="RETURNED">Returned</option>
              </select>
            </label>
          </div>
          <label className="text-sm font-medium text-foreground">
            Recipient email
            <input value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
          </label>
          {isMail ? (
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm font-medium text-foreground">
                Tracking carrier
                <input value={trackingCarrier} onChange={(event) => setTrackingCarrier(event.target.value)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
              </label>
              <label className="text-sm font-medium text-foreground">
                Tracking number
                <input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm" />
              </label>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Recording…' : 'Record delivery'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
