import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabaseClient as mhdSupabase } from '@/lib/supabase/supabaseClient';
import {
  mhdEndImpersonation,
  mhdEnrollTotpFactor,
  mhdGetCurrentAuthSession,
  mhdListCompaniesForImpersonation,
  mhdListMfaFactors,
  mhdLoadCurrentUserProfile,
  mhdSendPasswordReset,
  mhdSignInWithMagicLink,
  mhdSignInWithPassword,
  mhdSignOut,
  mhdStartImpersonation,
  mhdUnenrollMfaFactor,
  mhdUpdatePassword,
  mhdVerifyTotpFactor,
} from '../Service';
import type { MhdAuthState } from '../Types';
import { MhdAuthContext, type MhdAuthContextValue } from '../MhdAuthContext';

const mhdInitialAuthState: MhdAuthState = {
  isLoading: true,
  isAuthenticated: false,
  userEmail: null,
  authUserId: null,
  profile: null,
  roles: [],
};

export function MhdAuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<MhdAuthState>(mhdInitialAuthState);

  const applySession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setAuthState({ ...mhdInitialAuthState, isLoading: false });
      return;
    }

    const profile = await mhdLoadCurrentUserProfile(session.user.id);

    setAuthState({
      isLoading: false,
      isAuthenticated: true,
      userEmail: session.user.email ?? null,
      authUserId: session.user.id,
      profile,
      roles: profile?.roleNames ?? [],
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    setAuthState((current) => ({ ...current, isLoading: true }));
    const { session } = await mhdGetCurrentAuthSession();
    await applySession(session);
  }, [applySession]);

  useEffect(() => {
    let isMounted = true;

    mhdGetCurrentAuthSession()
      .then(({ session }) => {
        if (!isMounted) return undefined;
        return applySession(session);
      })
      .catch(() => {
        if (isMounted) setAuthState({ ...mhdInitialAuthState, isLoading: false });
      });

    const { data } = mhdSupabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        void applySession(session);
      },
    );

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [applySession]);

  const value = useMemo<MhdAuthContextValue>(
    () => ({
      ...authState,
      refreshProfile,
      signIn: async (input) => {
        const { session } = await mhdSignInWithPassword(input);
        await applySession(session);
      },
      signOut: async () => {
        await mhdSignOut();
        setAuthState({ ...mhdInitialAuthState, isLoading: false });
      },
      sendPasswordReset: mhdSendPasswordReset,
      signInWithMagicLink: mhdSignInWithMagicLink,
      updatePassword: mhdUpdatePassword,
      enrollTotpFactor: mhdEnrollTotpFactor,
      verifyTotpFactor: mhdVerifyTotpFactor,
      listMfaFactors: mhdListMfaFactors,
      unenrollMfaFactor: mhdUnenrollMfaFactor,
      startImpersonation: async (role, companyId) => {
        await mhdStartImpersonation(role, companyId);
        await refreshProfile();
      },
      endImpersonation: async () => {
        await mhdEndImpersonation();
        await refreshProfile();
      },
      listCompaniesForImpersonation: mhdListCompaniesForImpersonation,
    }),
    [applySession, authState, refreshProfile],
  );

  return <MhdAuthContext.Provider value={value}>{children}</MhdAuthContext.Provider>;
}
