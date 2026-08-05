import { useCallback, useEffect, useMemo, useState } from 'react';
import { KeyRound, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MhdCard, MhdCardHeader } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdModal } from '@/components/ui/MhdModal';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { useMhdAuth } from '../Hook';
import type { MhdMfaFactor, MhdTrustedDevice } from '../Types';

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function MhdAccountSecurityPage() {
  const {
    listMfaFactors,
    unenrollMfaFactor,
    listTrustedDevices,
    revokeTrustedDevice,
    generateMfaRecoveryCodes,
    countUnusedRecoveryCodes,
  } = useMhdAuth();

  const [factors, setFactors] = useState<MhdMfaFactor[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<MhdTrustedDevice[]>([]);
  const [unusedRecoveryCodeCount, setUnusedRecoveryCodeCount] = useState<number | null>(null);

  const [isLoadingFactors, setIsLoadingFactors] = useState(true);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [isLoadingRecoveryCodes, setIsLoadingRecoveryCodes] = useState(true);
  const [isRemovingFactor, setIsRemovingFactor] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);
  const [isGeneratingCodes, setIsGeneratingCodes] = useState(false);

  const [factorError, setFactorError] = useState<string | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [recoveryCodeError, setRecoveryCodeError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const [factorPendingRemoval, setFactorPendingRemoval] = useState<MhdMfaFactor | null>(null);
  const [isGenerateConfirmOpen, setIsGenerateConfirmOpen] = useState(false);
  const [generatedRecoveryCodes, setGeneratedRecoveryCodes] = useState<string[] | null>(null);

  const activeTrustedDevices = useMemo(
    () => trustedDevices.filter((device) => !device.revokedAt),
    [trustedDevices],
  );

  const loadFactors = useCallback(async () => {
    setFactorError(null);
    setIsLoadingFactors(true);
    try {
      setFactors(await listMfaFactors());
    } catch (error) {
      setFactorError(errorMessage(error, 'Unable to load MFA factors.'));
    } finally {
      setIsLoadingFactors(false);
    }
  }, [listMfaFactors]);

  const loadTrustedDevices = useCallback(async () => {
    setDeviceError(null);
    setIsLoadingDevices(true);
    try {
      setTrustedDevices(await listTrustedDevices());
    } catch (error) {
      setDeviceError(errorMessage(error, 'Unable to load trusted devices.'));
    } finally {
      setIsLoadingDevices(false);
    }
  }, [listTrustedDevices]);

  const loadRecoveryCodeCount = useCallback(async () => {
    setRecoveryCodeError(null);
    setIsLoadingRecoveryCodes(true);
    try {
      setUnusedRecoveryCodeCount(await countUnusedRecoveryCodes());
    } catch (error) {
      setRecoveryCodeError(errorMessage(error, 'Unable to load recovery code status.'));
    } finally {
      setIsLoadingRecoveryCodes(false);
    }
  }, [countUnusedRecoveryCodes]);

  useEffect(() => {
    void (async () => {
      await Promise.all([loadFactors(), loadTrustedDevices(), loadRecoveryCodeCount()]);
    })();
  }, [loadFactors, loadRecoveryCodeCount, loadTrustedDevices]);

  async function handleRemoveFactor() {
    if (!factorPendingRemoval) return;
    setFactorError(null);
    setIsRemovingFactor(true);
    try {
      await unenrollMfaFactor(factorPendingRemoval.id);
      setFactorPendingRemoval(null);
      await loadFactors();
    } catch (error) {
      setFactorError(errorMessage(error, 'Unable to remove MFA factor.'));
    } finally {
      setIsRemovingFactor(false);
    }
  }

  async function handleRevokeDevice(deviceId: string) {
    setDeviceError(null);
    setRevokingDeviceId(deviceId);
    try {
      await revokeTrustedDevice(deviceId);
      await loadTrustedDevices();
    } catch (error) {
      setDeviceError(errorMessage(error, 'Unable to revoke trusted device.'));
    } finally {
      setRevokingDeviceId(null);
    }
  }

  async function handleGenerateCodes() {
    setRecoveryCodeError(null);
    setIsGeneratingCodes(true);
    try {
      const codes = await generateMfaRecoveryCodes();
      setGeneratedRecoveryCodes(codes);
      setIsGenerateConfirmOpen(false);
      setUnusedRecoveryCodeCount(codes.length);
      setCopyStatus(null);
    } catch (error) {
      setRecoveryCodeError(errorMessage(error, 'Unable to generate recovery codes.'));
    } finally {
      setIsGeneratingCodes(false);
    }
  }

  async function handleCopyCodes() {
    if (!generatedRecoveryCodes) return;
    try {
      await navigator.clipboard.writeText(generatedRecoveryCodes.join('\n'));
      setCopyStatus('Copied');
    } catch {
      setCopyStatus('Unable to copy. Select the codes and copy them manually.');
    }
  }

  function closeGeneratedCodesModal() {
    setGeneratedRecoveryCodes(null);
    setCopyStatus(null);
    void loadRecoveryCodeCount();
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Account Security"
        description="Manage your authenticator app, trusted devices, and recovery codes."
      />

      <MhdCard className="space-y-4">
        <MhdCardHeader title="MFA factors" />
        {factorError ? (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{factorError}</p>
        ) : null}
        {isLoadingFactors ? (
          <p className="text-sm text-muted-foreground">Loading MFA factors...</p>
        ) : factors.length === 0 ? (
          <MhdEmptyState
            icon={KeyRound}
            title="No authenticator app enrolled."
            description="You will be asked to set one up before continuing."
            className="py-8"
          />
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {factors.map((factor) => (
              <div
                key={factor.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {factor.friendlyName ?? 'Authenticator app'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Status: {factor.status}</p>
                </div>
                {factor.status === 'verified' ? (
                  <Button
                    variant="destructive"
                    onClick={() => setFactorPendingRemoval(factor)}
                    disabled={isRemovingFactor}
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </MhdCard>

      <MhdCard className="space-y-4">
        <MhdCardHeader title="Trusted devices" />
        {deviceError ? (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{deviceError}</p>
        ) : null}
        {isLoadingDevices ? (
          <p className="text-sm text-muted-foreground">Loading trusted devices...</p>
        ) : activeTrustedDevices.length === 0 ? (
          <MhdEmptyState
            icon={MonitorSmartphone}
            title="No trusted devices."
            description="Devices you trust after MFA verification will appear here."
            className="py-8"
          />
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {activeTrustedDevices.map((device) => (
              <div
                key={device.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {device.label ?? 'Trusted device'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    First seen {formatDate(device.firstSeenAt)}. Last seen{' '}
                    {formatDate(device.lastSeenAt)}.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => void handleRevokeDevice(device.id)}
                  disabled={revokingDeviceId === device.id}
                >
                  {revokingDeviceId === device.id ? 'Revoking...' : 'Revoke'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </MhdCard>

      <MhdCard className="space-y-4">
        <MhdCardHeader
          title="Recovery codes"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setRecoveryCodeError(null);
                setIsGenerateConfirmOpen(true);
              }}
              disabled={isLoadingRecoveryCodes || isGeneratingCodes}
            >
              Generate new recovery codes
            </Button>
          }
        />
        {recoveryCodeError ? (
          <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{recoveryCodeError}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">
          {isLoadingRecoveryCodes
            ? 'Loading recovery code status...'
            : `${unusedRecoveryCodeCount ?? 0} recovery codes remaining.`}
        </p>
      </MhdCard>

      {factorPendingRemoval ? (
        <MhdModal onClose={() => setFactorPendingRemoval(null)} title="Remove MFA factor">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Remove MFA factor?</h2>
            <p className="text-sm text-muted-foreground">
              Every account requires MFA. Removing your only factor will immediately require
              setting up a new one before you can continue using the app.
            </p>
            {factorError ? (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{factorError}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setFactorPendingRemoval(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => void handleRemoveFactor()}
                disabled={isRemovingFactor}
              >
                {isRemovingFactor ? 'Removing...' : 'Remove factor'}
              </Button>
            </div>
          </div>
        </MhdModal>
      ) : null}

      {isGenerateConfirmOpen ? (
        <MhdModal onClose={() => setIsGenerateConfirmOpen(false)} title="Generate recovery codes">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Generate new recovery codes?</h2>
            <p className="text-sm text-muted-foreground">
              This invalidates any existing unused recovery codes. Save the new codes before
              closing the next dialog because they are shown only once.
            </p>
            {recoveryCodeError ? (
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{recoveryCodeError}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsGenerateConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void handleGenerateCodes()} disabled={isGeneratingCodes}>
                {isGeneratingCodes ? 'Generating...' : 'Generate codes'}
              </Button>
            </div>
          </div>
        </MhdModal>
      ) : null}

      {generatedRecoveryCodes ? (
        <MhdModal onClose={closeGeneratedCodesModal} title="Recovery codes">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Recovery codes</h2>
            <p className="rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              These codes are shown only once and will not be retrievable again. Closing this dialog
              or navigating away loses them permanently.
            </p>
            <pre className="max-h-72 overflow-auto rounded-md border border-border bg-slate-950 p-4 text-sm text-white">
              {generatedRecoveryCodes.join('\n')}
            </pre>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {copyStatus ? (
                <p className="text-sm text-muted-foreground">{copyStatus}</p>
              ) : (
                <span />
              )}
              <Button variant="secondary" onClick={() => void handleCopyCodes()}>
                Copy all
              </Button>
            </div>
          </div>
        </MhdModal>
      ) : null}
    </div>
  );
}
