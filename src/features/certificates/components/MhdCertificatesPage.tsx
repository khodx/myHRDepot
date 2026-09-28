import { useState } from 'react';
import { Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdBadge, type MhdBadgeVariant } from '@/components/ui/MhdBadge';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdFilterBar, MhdFilterSelect } from '@/components/ui/MhdFilterBar';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdAuth } from '@/features/authentication/Hook';
import {
  useMhdCertificateTemplates,
  useMhdCertificatesForCompany,
  useMhdRevokeCertificate,
} from '../Hook';
import { mhdFormatCertificateStatus, type MhdCertificateIssuance } from '../Types';
import { mhdCertificateEntityTypeLabel } from '@/features/esignature/Types';
import { MhdCertificateIssueDialog } from './MhdCertificateIssueDialog';

const STATUS_FILTERS = ['ALL', 'GENERATED', 'MERGED', 'PENDING', 'FAILED', 'REVOKED', 'EXPIRED'];

function statusBadgeVariant(status: string): MhdBadgeVariant {
  switch (status) {
    case 'GENERATED':
    case 'MERGED':
      return 'success';
    case 'PENDING':
      return 'info';
    case 'FAILED':
      return 'error';
    case 'REVOKED':
      return 'neutral';
    case 'EXPIRED':
      return 'warning';
    default:
      return 'neutral';
  }
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export function MhdCertificatesPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const [status, setStatus] = useState('ALL');
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [issuedNotice, setIssuedNotice] = useState<string | null>(null);

  const templates = useMhdCertificateTemplates();
  const certificates = useMhdCertificatesForCompany(
    companyId || null,
    status === 'ALL' ? null : status,
  );
  const revoke = useMhdRevokeCertificate();

  async function handleRevoke(certificate: MhdCertificateIssuance) {
    const reason = window.prompt(`Reason for revoking this certificate (${certificate.referenceId}):`);
    if (!reason?.trim()) return;
    await revoke.mutateAsync({ certificateId: certificate.id, reason: reason.trim() });
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Certificates"
        description="Awards, promotions, training completions, and general-purpose certificates — issued, verified, and tracked in one ledger."
        actions={
          <Button onClick={() => setShowIssueDialog(true)}>Issue Certificate</Button>
        }
      />

      {issuedNotice ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Certificate issued. Verification code: <span className="font-mono">{issuedNotice}</span>{' '}
          <a
            href={`/verify/${issuedNotice}`}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline"
          >
            View verification page
          </a>
        </div>
      ) : null}

      <MhdFilterBar onClear={() => setStatus('ALL')}>
        <MhdFilterSelect
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === 'ALL' ? 'All statuses' : mhdFormatCertificateStatus(s)}
            </option>
          ))}
        </MhdFilterSelect>
      </MhdFilterBar>

      {certificates.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading certificates…</p>
      ) : (certificates.data ?? []).length === 0 ? (
        <MhdEmptyState
          icon={Award}
          title="No certificates yet"
          description="Issue an award, promotion, or general certificate to get started."
          action={<Button onClick={() => setShowIssueDialog(true)}>Issue Certificate</Button>}
        />
      ) : (
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>Recipient</MhdTh>
              <MhdTh>Type</MhdTh>
              <MhdTh>Status</MhdTh>
              <MhdTh>Issued</MhdTh>
              <MhdTh>Expires</MhdTh>
              <MhdTh>Verification</MhdTh>
              <MhdTh className="text-right">Actions</MhdTh>
            </tr>
          </thead>
          <tbody>
            {(certificates.data ?? []).map((certificate) => (
              <MhdTr key={certificate.id}>
                <MhdTd>{certificate.personDisplayName ?? '—'}</MhdTd>
                <MhdTd>{certificate.templateName ?? mhdCertificateEntityTypeLabel(certificate.entityType)}</MhdTd>
                <MhdTd>
                  <MhdBadge variant={statusBadgeVariant(certificate.status)}>
                    {mhdFormatCertificateStatus(certificate.status)}
                  </MhdBadge>
                </MhdTd>
                <MhdTd>{formatDate(certificate.generatedAt ?? certificate.createdAt)}</MhdTd>
                <MhdTd>{formatDate(certificate.expiresAt)}</MhdTd>
                <MhdTd className="whitespace-nowrap">
                  <a
                    href={`/verify/${certificate.verificationCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-accent hover:text-accent-hover"
                  >
                    Verify
                  </a>
                </MhdTd>
                <MhdTd className="whitespace-nowrap text-right" data-row-click-ignore>
                  {certificate.status !== 'REVOKED' ? (
                    <button
                      type="button"
                      onClick={() => void handleRevoke(certificate)}
                      disabled={revoke.isPending}
                      className="text-xs font-medium text-rose-600 hover:text-rose-700"
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Revoked</span>
                  )}
                </MhdTd>
              </MhdTr>
            ))}
          </tbody>
        </MhdTable>
      )}

      {showIssueDialog ? (
        <MhdCertificateIssueDialog
          companyId={companyId}
          templates={templates.data ?? []}
          onClose={() => setShowIssueDialog(false)}
          onIssued={(code) => {
            setShowIssueDialog(false);
            setIssuedNotice(code);
          }}
        />
      ) : null}
    </div>
  );
}
