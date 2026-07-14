import { createContext } from 'react';
import type { MhdAuthState, MhdForgotPasswordInput, MhdLoginInput, MhdResetPasswordInput } from './Types';

export interface MhdAuthContextValue extends MhdAuthState {
  refreshProfile: () => Promise<void>;
  signIn: (input: MhdLoginInput) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (input: MhdForgotPasswordInput) => Promise<void>;
  updatePassword: (input: MhdResetPasswordInput) => Promise<void>;
}

export const MhdAuthContext = createContext<MhdAuthContextValue | null>(null);
