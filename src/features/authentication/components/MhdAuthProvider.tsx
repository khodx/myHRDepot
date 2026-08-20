import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { supabaseClient as mhdSupabase } from '@/lib/supabase/supabaseClient';
import {
  mhdConsumeMfaRecoveryCode,
  mhdCountUnusedRecoveryCodes,
  mhdEndImpersonation,
  mhdEnrollTotpFactor,
  mhdGenerateMfaRecoveryCodes,
  mhdGetCurrentAuthSession,
  mhdListCompaniesForImpersonation,
  mhdListMfaFactors,
  mhdListTrustedDevices,
  mhdLoadCurrentUserProfile,
  mhdRegisterTrustedDevice,
  mhdRevokeTrustedDevice,
  mhdSendPasswordReset,
  mhdSignInWithMagicLink,
  mhdSignInWithPassword,
  mhdSignOut,
  mhdStartImpersonation,
  mhdUnenrollMfaFactor,
  mhdUpdatePassword,
  mhdVerifyTotpFactor,
} from '../Service';
import type { MhdAuthRoleName, MhdAuthState } from '../Types';
import { MhdAuthContext, type MhdAuthContextValue } from '../MhdAuthContext';

const mhdInitialAuthState: MhdAuthState = {
  isLoading: true,
  isAuthenticated: false,
  userEmail: null,
  authUserId: null,
  profile: null,
  roles: [],
  actingAsRoles: null,
};

const MHD_ACTING_AS_ROLES_STORAGE_PREFIX = 'mhd-acting-as-roles:';

function mhdReadStoredActingAsRoles(
  userId: string,
  realRoleNames: MhdAuthRoleName[],
): MhdAuthRoleName[] | null {
  try {
    const raw = window.localStorage.getItem(MHD_ACTING_AS_ROLES_STORAGE_PREFIX + userId);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // Only honor roles the user still actually holds — a role could have
    // been revoked since this preference was saved.
    const stillHeld = parsed.filter(
      (role): role is MhdAuthRoleName =>
        typeof role === 'string' && realRoleNames.includes(role as MhdAuthRoleName),
    );
    return stillHeld.length > 0 ? stillHeld : null;
  } catch {
    return null;
  }
}

function mhdWriteStoredActingAsRoles(userId: string, roles: MhdAuthRoleName[] | null): void {
  try {
    const key = MHD_ACTING_AS_ROLES_STORAGE_PREFIX + userId;
    if (roles === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(roles));
    }
  } catch {
    // localStorage can throw (private browsing, quota) — acting-as is a
    // convenience preference, never worth failing the app over.
  }
}

/** The effective role set nav/route-access consume: acting-as never
 *  applies during impersonation (the two mechanisms are deliberately kept
 *  from combining — see MhdAuthState.roles' own doc comment). */
function mhdComputeEffectiveRoles(
  profile: MhdAuthState['profile'],
  actingAsRoles: MhdAuthRoleName[] | null,
): MhdAuthRoleName[] {
  if (!profile) return [];
  if (profile.impersonation.isImpersonating) return profile.roleNames;
  return actingAsRoles ?? profile.roleNames;
}

export function MhdAuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<MhdAuthState>(mhdInitialAuthState);

  const applySession = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setAuthState({ ...mhdInitialAuthState, isLoading: false });
      return;
    }

    const profile = await mhdLoadCurrentUserProfile(session.user.id);
    const actingAsRoles = profile
      ? mhdReadStoredActingAsRoles(profile.userId, profile.realRoleNames)
      : null;

    setAuthState({
      isLoading: false,
      isAuthenticated: true,
      userEmail: session.user.email ?? null,
      authUserId: session.user.id,
      profile,
      roles: mhdComputeEffectiveRoles(profile, actingAsRoles),
      actingAsRoles,
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
      registerTrustedDevice: mhdRegisterTrustedDevice,
      listTrustedDevices: mhdListTrustedDevices,
      revokeTrustedDevice: mhdRevokeTrustedDevice,
      generateMfaRecoveryCodes: mhdGenerateMfaRecoveryCodes,
      countUnusedRecoveryCodes: mhdCountUnusedRecoveryCodes,
      consumeMfaRecoveryCode: mhdConsumeMfaRecoveryCode,
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
      setActingAsRoles: (nextActingAsRoles) => {
        setAuthState((current) => {
          if (!current.profile) return current;
          mhdWriteStoredActingAsRoles(current.profile.userId, nextActingAsRoles);
          return {
            ...current,
            actingAsRoles: nextActingAsRoles,
            roles: mhdComputeEffectiveRoles(current.profile, nextActingAsRoles),
          };
        });
      },
    }),
    [applySession, authState, refreshProfile],
  );

  return <MhdAuthContext.Provider value={value}>{children}</MhdAuthContext.Provider>;
}
