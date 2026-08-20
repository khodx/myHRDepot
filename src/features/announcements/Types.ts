export type MhdAnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'expired' | 'archived';

export type MhdAnnouncementAudienceScope = 'company' | 'roles';

export const MHD_ANNOUNCEMENT_STATUS_LABELS: Record<MhdAnnouncementStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
  expired: 'Expired',
  archived: 'Archived',
};

export interface MhdAnnouncementRpcRow {
  id: string;
  reference_id: string;
  title: string;
  status: MhdAnnouncementStatus;
  audience_scope: MhdAnnouncementAudienceScope;
  audience_roles: string[] | null;
  publish_at: string;
  published_at: string | null;
  expires_at: string | null;
}

export interface MhdAnnouncementListItem {
  id: string;
  referenceId: string;
  title: string;
  status: MhdAnnouncementStatus;
  audienceScope: MhdAnnouncementAudienceScope;
  audienceRoles: string[] | null;
  publishAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
}

export interface MhdAnnouncementDetailRpcRow {
  id: string;
  reference_id: string;
  company_id: string;
  title: string;
  body_rich_text: unknown;
  body_plain_text: string;
  status: MhdAnnouncementStatus;
  audience_scope: MhdAnnouncementAudienceScope;
  audience_roles: string[] | null;
  publish_at: string;
  published_at: string | null;
  expires_at: string | null;
  archived_at: string | null;
}

export interface MhdAnnouncementDetail {
  id: string;
  referenceId: string;
  companyId: string;
  title: string;
  bodyRichText: unknown;
  bodyPlainText: string;
  status: MhdAnnouncementStatus;
  audienceScope: MhdAnnouncementAudienceScope;
  audienceRoles: string[] | null;
  publishAt: string;
  publishedAt: string | null;
  expiresAt: string | null;
  archivedAt: string | null;
}

export interface MhdActiveAnnouncementRpcRow {
  id: string;
  reference_id: string;
  title: string;
  body_plain_text: string;
  published_at: string | null;
  expires_at: string | null;
}

export interface MhdActiveAnnouncement {
  id: string;
  referenceId: string;
  title: string;
  bodyPlainText: string;
  publishedAt: string | null;
  expiresAt: string | null;
}

export interface MhdCreateAnnouncementInput {
  companyId: string;
  title: string;
  bodyRichText: unknown;
  bodyPlainText: string;
  audienceScope: MhdAnnouncementAudienceScope;
  audienceRoles?: string[] | null;
  publishAt?: string | null;
  expiresAt?: string | null;
}

export interface MhdUpdateAnnouncementInput {
  id: string;
  title?: string;
  bodyRichText?: unknown;
  bodyPlainText?: string;
  audienceScope?: MhdAnnouncementAudienceScope;
  audienceRoles?: string[] | null;
  publishAt?: string | null;
  expiresAt?: string | null;
}
