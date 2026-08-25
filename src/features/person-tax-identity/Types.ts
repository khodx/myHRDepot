export type MhdCitizenshipStatus =
  | 'US_CITIZEN'
  | 'NONCITIZEN_NATIONAL'
  | 'LAWFUL_PERMANENT_RESIDENT'
  | 'ALIEN_AUTHORIZED_TO_WORK';

export type MhdW4FilingStatus = 'SINGLE_OR_MFS' | 'MFJ_OR_QSS' | 'HEAD_OF_HOUSEHOLD';

export type MhdI9RevealFieldKey =
  | 'ssn'
  | 'lawful_permanent_resident_number'
  | 'alien_uscis_number'
  | 'alien_i94_number'
  | 'alien_foreign_passport_number';

/**
 * Masked read of `person_i9_identity` (migration 0226). Ciphertext columns
 * (SSN, A-number, I-94 number, foreign passport number) never leave the
 * database as plaintext here — they collapse to a `has*` boolean, matching
 * the masking discipline already established for encrypted form submission
 * fields (0051). Plaintext is only obtainable via `revealI9IdentityField`,
 * an audited, Platform-Admin/HR-Partner-only action — never used for prefill.
 */
export interface MhdPersonI9Identity {
  id: string;
  personId: string;
  hasSsn: boolean;
  dateOfBirth: string | null;
  mailingAddressStreet: string | null;
  mailingAddressApt: string | null;
  mailingAddressCity: string | null;
  mailingAddressState: string | null;
  mailingAddressZip: string | null;
  citizenshipStatus: MhdCitizenshipStatus;
  hasLawfulPermanentResidentNumber: boolean;
  hasAlienUscisNumber: boolean;
  hasAlienI94Number: boolean;
  hasAlienForeignPassportNumber: boolean;
  alienForeignPassportCountry: string | null;
  alienWorkAuthorizedUntil: string | null;
  updatedAt: string | null;
}

export interface MhdUpsertPersonI9IdentityInput {
  personId: string;
  ssn?: string | null;
  dateOfBirth?: string | null;
  mailingAddressStreet?: string | null;
  mailingAddressApt?: string | null;
  mailingAddressCity?: string | null;
  mailingAddressState?: string | null;
  mailingAddressZip?: string | null;
  citizenshipStatus: MhdCitizenshipStatus;
  lawfulPermanentResidentNumber?: string | null;
  alienUscisNumber?: string | null;
  alienI94Number?: string | null;
  alienForeignPassportNumber?: string | null;
  alienForeignPassportCountry?: string | null;
  alienWorkAuthorizedUntil?: string | null;
}

export interface MhdPersonW4Withholding {
  id: string;
  personId: string;
  taxYear: number;
  filingStatus: MhdW4FilingStatus;
  multipleJobsCheckbox: boolean;
  qualifyingChildrenCount: number;
  otherDependentsCount: number;
  otherCreditsAmount: number;
  otherIncomeAmount: number;
  deductionsAmount: number;
  extraWithholdingAmount: number;
  exemptFromWithholding: boolean;
  updatedAt: string | null;
}

export interface MhdUpsertPersonW4WithholdingInput {
  personId: string;
  taxYear: number;
  filingStatus: MhdW4FilingStatus;
  multipleJobsCheckbox: boolean;
  qualifyingChildrenCount: number;
  otherDependentsCount: number;
  otherCreditsAmount: number;
  otherIncomeAmount: number;
  deductionsAmount: number;
  extraWithholdingAmount: number;
  exemptFromWithholding: boolean;
}
