/**
 * The Certificates Engine (migrations 0315/0316/0319/0321) issues certificates
 * through the same Document Generation Engine every other generated document
 * uses, and records every issuance in `audit_certificates` — the same generic,
 * publicly-verifiable ledger the e-signature module's audit certificates use
 * (see `@/features/esignature`'s `mhdCertificateEntityTypeLabel` for the
 * shared `/verify/:code` page's label mapping). Training completion
 * certificates are issued through this same path via
 * `mhd_training_certificate_generate` (see `@/features/training`); this
 * feature covers the categories that have no other owning module: awards,
 * promotions, and general-purpose certificates, plus the cross-category
 * admin ledger.
 */

/** Categories this feature can manually issue. Training certificates are issued from the Training feature instead. */
export type MhdCertificateCategory = 'AWARD' | 'PROMOTION' | 'GENERAL_CERTIFICATE';

export const MHD_CERTIFICATE_CATEGORIES: MhdCertificateCategory[] = [
  'AWARD',
  'PROMOTION',
  'GENERAL_CERTIFICATE',
];

export const MHD_CERTIFICATE_CATEGORY_LABELS: Record<MhdCertificateCategory, string> = {
  AWARD: 'Award',
  PROMOTION: 'Promotion',
  GENERAL_CERTIFICATE: 'General Certificate',
};

export const MHD_CERTIFICATE_TEMPLATE_KEYS: Record<MhdCertificateCategory, string> = {
  AWARD: 'AWARD_CERTIFICATE',
  PROMOTION: 'PROMOTION_CERTIFICATE',
  GENERAL_CERTIFICATE: 'GENERAL_CERTIFICATE',
};

export interface MhdCertificateTemplate {
  id: string;
  name: string;
  templateKey: string;
  applicableEntityType: string | null;
}

/** A row from the shared audit_certificates ledger, enriched with joined names (0321). */
export interface MhdCertificateIssuance {
  id: string;
  referenceId: string;
  verificationCode: string;
  status: string;
  entityType: string;
  personId: string | null;
  personDisplayName: string | null;
  templateName: string | null;
  templateKey: string | null;
  generatedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface MhdCertificateIssueInput {
  companyId: string;
  templateId: string;
  personId: string;
  entityType: MhdCertificateCategory;
  mergeData: Record<string, unknown>;
  expiresAt?: string | null;
}

export interface MhdCertificateIssueResult {
  certificateId: string;
  verificationCode: string;
}

export function mhdFormatCertificateStatus(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'Generating';
    case 'GENERATED':
    case 'MERGED':
      return 'Issued';
    case 'FAILED':
      return 'Failed';
    case 'REVOKED':
      return 'Revoked';
    case 'EXPIRED':
      return 'Expired';
    default:
      return status;
  }
}
