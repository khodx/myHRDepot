import type { MhdAuthRoleName } from '@/features/authentication/Types';

// Same privileged set as the /audit-reports route rule in mhdRouteAccess.ts
// and the RPC's own server-side check.
export const MHD_AUDIT_REPORTS_LINK_ROLES: MhdAuthRoleName[] = ['Platform Admin', 'HR Partner'];
