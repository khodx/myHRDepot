import type { MhdTaskAssignableUser } from '@/features/tasks/Types';

export type MhdEsignatureStatus =
  'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED' | 'VOIDED' | 'EXPIRED';
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
  companyId: string | null;
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
  signatureFont: MhdSignatureFontKey;
  signatureColor: MhdSignatureColorKey;
}

export type MhdSignatureFontKey =
  | 'helvetica'
  | 'times_roman'
  | 'courier'
  | 'dancing_script'
  | 'pacifico'
  | 'great_vibes'
  | 'alex_brush'
  | 'sacramento'
  | 'allura'
  | 'petit_formal_script';

export type MhdSignatureColorKey = 'black' | 'blue';

// Mirrors the font vocabulary enforced by esignature_signers_signature_font_check
// (migration 0116) and the fonts render-audit-certificate embeds via fontkit
// (npm:@pdf-lib/fontkit) from ./fonts/*.ttf. cssFontFamily/googleFontsFamily
// drive the on-screen live preview only; the PDF embed is independent and uses
// the bundled .ttf files directly, not a web font load.
export interface MhdSignatureFontOption {
  key: MhdSignatureFontKey;
  label: string;
  category: 'standard' | 'script';
  cssFontFamily: string;
  googleFontsFamily: string | null;
}

export const MHD_SIGNATURE_FONT_OPTIONS: MhdSignatureFontOption[] = [
  { key: 'helvetica', label: 'Helvetica', category: 'standard', cssFontFamily: 'Helvetica, Arial, sans-serif', googleFontsFamily: null },
  { key: 'times_roman', label: 'Times New Roman', category: 'standard', cssFontFamily: '"Times New Roman", Times, serif', googleFontsFamily: null },
  { key: 'courier', label: 'Courier', category: 'standard', cssFontFamily: '"Courier New", Courier, monospace', googleFontsFamily: null },
  { key: 'dancing_script', label: 'Dancing Script', category: 'script', cssFontFamily: '"Dancing Script", cursive', googleFontsFamily: 'Dancing+Script' },
  { key: 'pacifico', label: 'Pacifico', category: 'script', cssFontFamily: '"Pacifico", cursive', googleFontsFamily: 'Pacifico' },
  { key: 'great_vibes', label: 'Great Vibes', category: 'script', cssFontFamily: '"Great Vibes", cursive', googleFontsFamily: 'Great+Vibes' },
  { key: 'alex_brush', label: 'Alex Brush', category: 'script', cssFontFamily: '"Alex Brush", cursive', googleFontsFamily: 'Alex+Brush' },
  { key: 'sacramento', label: 'Sacramento', category: 'script', cssFontFamily: '"Sacramento", cursive', googleFontsFamily: 'Sacramento' },
  { key: 'allura', label: 'Allura', category: 'script', cssFontFamily: '"Allura", cursive', googleFontsFamily: 'Allura' },
  { key: 'petit_formal_script', label: 'Petit Formal Script', category: 'script', cssFontFamily: '"Petit Formal Script", cursive', googleFontsFamily: 'Petit+Formal+Script' },
];

export interface MhdSignatureColorOption {
  key: MhdSignatureColorKey;
  label: string;
  cssColor: string;
}

export const MHD_SIGNATURE_COLOR_OPTIONS: MhdSignatureColorOption[] = [
  { key: 'black', label: 'Black', cssColor: '#0d0d14' },
  { key: 'blue', label: 'Blue', cssColor: '#0f1f8c' },
];

export interface MhdSignatureConsentRecord {
  requestId: string;
  signerId: string;
  consentedAt: string;
}

export interface MhdAuditCertificate {
  id: string;
  referenceId: string;
  verificationCode: string;
  entityType: string;
  entityId: string;
  status: string;
  generatedAt: string | null;
  digitallySigned: boolean;
  certificateDriveFileId: string | null;
}

export interface MhdAuditCertificateVerification {
  isValid: boolean;
  entityType: string | null;
  status: string | null;
  generatedAt: string | null;
  digitallySigned: boolean;
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
