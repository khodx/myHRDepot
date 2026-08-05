import { createContext } from 'react';
import type {
  MhdAuthRoleName,
  MhdAuthState,
  MhdForgotPasswordInput,
  MhdImpersonationCompanyOption,
  MhdLoginInput,
  MhdMagicLinkInput,
  MhdMfaFactor,
  MhdResetPasswordInput,
  MhdTrustedDevice,
  MhdTotpEnrollment,
} from './Types';

export interface MhdAuthContextValue extends MhdAuthState {
  refreshProfile: () => Promise<void>;
  signIn: (input: MhdLoginInput) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (input: MhdForgotPasswordInput) => Promise<void>;
  /** Sends a passwordless sign-in link to the user's email address. */
  signInWithMagicLink: (input: MhdMagicLinkInput) => Promise<void>;
  updatePassword: (input: MhdResetPasswordInput) => Promise<void>;
  enrollTotpFactor: () => Promise<MhdTotpEnrollment>;
  verifyTotpFactor: (factorId: string, code: string) => Promise<void>;
  registerTrustedDevice: (label?: string) => Promise<void>;
  listTrustedDevices: () => Promise<MhdTrustedDevice[]>;
  revokeTrustedDevice: (deviceId: string) => Promise<void>;
  generateMfaRecoveryCodes: () => Promise<string[]>;
  countUnusedRecoveryCodes: () => Promise<number>;
  consumeMfaRecoveryCode: (code: string) => Promise<void>;
  listMfaFactors: () => Promise<MhdMfaFactor[]>;
  unenrollMfaFactor: (factorId: string) => Promise<void>;
  /** Starts a "View As" session and refreshes the profile in one step. */
  startImpersonation: (role: MhdAuthRoleName, companyId: string | null) => Promise<void>;
  /** Ends the active "View As" session and refreshes the profile. */
  endImpersonation: () => Promise<void>;
  /** Loads the company picker options for the "View As" menu. */
  listCompaniesForImpersonation: () => Promise<MhdImpersonationCompanyOption[]>;
}

export const MhdAuthContext = createContext<MhdAuthContextValue | null>(null);
