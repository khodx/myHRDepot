import type { MhdTaskAssignableUser } from '@/features/tasks/Types';

export type MhdEsignatureStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED' | 'VOIDED' | 'EXPIRED';
export type MhdEsignatureSignerStatus = 'PENDING' | 'VIEWED' | 'SIGNED' | 'DECLINED';
export type MhdEsignatureSigningOrder = 'SEQUENTIAL' | 'PARALLEL';
export type MhdEsignatureEventType =
  | 'SENT'
  | 'VIEWED'
  | 'SIGNED'
  | 'DECLINED'
  | 'REMINDER_SENT'
  | 'VOIDED'
  | 'CONSENT_CAPTURED'
  | 'HASH_VERIFIED'
  | 'COMPLETED_COPY_SENT';

export interface MhdEsignatureSigner {
  id: string;
  signerOrder: number;
  userId: string | null;
  externalEmail: string | null;
  externalName: string | null;
  status: MhdEsignatureSignerStatus;
  signedAt: string | null;
  declinedReason: string | null;
  signatureName: string | null;
  consentedAt: string | null;
}

export interface MhdEsignatureRequest {
  id: string;
  referenceId: string;
  companyId: string;
  documentGenerationId: string;
  documentName: string;
  documentDriveFileId: string;
  signedDriveFileId: string | null;
  documentHash: string | null;
  signedDocumentHash: string | null;
  disclosureText: string;
  disclosureVersion: string;
  signingOrder: MhdEsignatureSigningOrder;
  status: MhdEsignatureStatus;
  expiresAt: string | null;
  completedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  signers: MhdEsignatureSigner[];
}

export interface MhdEsignatureEvent {
  id: string;
  requestId: string;
  signerId: string | null;
  eventType: MhdEsignatureEventType;
  eventAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown>;
}

export interface MhdEsignatureGeneratedDocument {
  id: string;
  referenceId: string;
  templateId: string;
  templateVersion: number;
  templateName: string;
  requiresSignature: boolean;
  companyId: string;
  entityType: string;
  entityId: string;
  status: 'PENDING' | 'GENERATED' | 'FAILED' | 'SIGNED' | 'VOIDED';
  outputFileName: string | null;
  outputDriveFileId: string | null;
  generatedAt: string | null;
  esignatureRequestId: string | null;
  mergeData: Record<string, unknown>;
}

export type MhdEsignatureAssignableUser = MhdTaskAssignableUser;

export type MhdEsignatureSignerInput =
  | {
      kind: 'internal';
      userId: string;
    }
  | {
      kind: 'external';
      externalEmail: string;
      externalName: string;
    };

export interface MhdCreateEsignatureRequestFromGenerationInput {
  companyId: string;
  generationId: string;
  documentHash: string;
  signers: MhdEsignatureSignerInput[];
  signingOrder: MhdEsignatureSigningOrder;
  expiresAt?: string | null;
  disclosureText?: string | null;
  disclosureVersion?: string | null;
}

export interface MhdCreateEsignatureRequestResult {
  request: MhdEsignatureRequest;
  invitationErrors: string[];
}

export interface MhdSignatureRequestByToken {
  requestId: string;
  referenceId: string;
  documentName: string;
  documentDriveFileId: string;
  documentHash: string | null;
  signedDriveFileId: string | null;
  disclosureText: string;
  disclosureVersion: string;
  requestStatus: MhdEsignatureStatus;
  signingOrder: MhdEsignatureSigningOrder;
  signerId: string;
  signerName: string;
  signerStatus: MhdEsignatureSignerStatus;
  signerOrderPosition: number;
  consentedAt: string | null;
}

export interface MhdSignatureConsentRecord {
  requestId: string;
  signerId: string;
  consentedAt: string;
}

export function mhdBuildGoogleDriveViewUrl(fileId: string | null | undefined): string | null {
  if (!fileId || fileId.trim().length === 0) return null;
  return `https://drive.google.com/file/d/${fileId}/view`;
}

export function mhdBuildGoogleDrivePreviewUrl(fileId: string | null | undefined): string | null {
  if (!fileId || fileId.trim().length === 0) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function mhdIsSha256Hex(value: string): boolean {
  return /^[a-f0-9]{64}$/i.test(value.trim());
}
