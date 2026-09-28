import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Json } from '@/types/database.types';
import type {
  MhdCertificateIssuance,
  MhdCertificateIssueInput,
  MhdCertificateIssueResult,
  MhdCertificateTemplate,
} from './Types';

interface MhdCertificateIssuanceRpcRow {
  id: string;
  reference_id: string;
  verification_code: string;
  status: string;
  entity_type: string;
  person_id: string | null;
  person_display_name: string | null;
  template_name: string | null;
  template_key: string | null;
  generated_at: string | null;
  expires_at: string | null;
  created_at: string;
}

function mapIssuance(row: MhdCertificateIssuanceRpcRow): MhdCertificateIssuance {
  return {
    id: row.id,
    referenceId: row.reference_id,
    verificationCode: row.verification_code,
    status: row.status,
    entityType: row.entity_type,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    templateName: row.template_name,
    templateKey: row.template_key,
    generatedAt: row.generated_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export const mhdCertificatesService = {
  /** System-wide certificate templates (company_id is null) available to issue from. */
  async listIssuableTemplates(): Promise<MhdCertificateTemplate[]> {
    const { data, error } = await supabaseClient
      .from('document_templates')
      .select('id, name, template_key, applicable_entity_type')
      .eq('template_type', 'CERTIFICATE')
      .eq('is_active', true)
      .eq('is_deleted', false)
      .is('company_id', null)
      .order('name');
    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      templateKey: row.template_key ?? '',
      applicableEntityType: row.applicable_entity_type,
    }));
  },

  async listForCompany(
    companyId: string,
    status?: string | null,
    personId?: string | null,
  ): Promise<MhdCertificateIssuance[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_certificates_for_company', {
      p_company_id: companyId,
      p_status: status ?? undefined,
      p_person_id: personId ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as unknown as MhdCertificateIssuanceRpcRow[]).map(mapIssuance);
  },

  async listMine(): Promise<MhdCertificateIssuance[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_my_certificates');
    if (error) throw error;
    return ((data ?? []) as unknown as MhdCertificateIssuanceRpcRow[]).map(mapIssuance);
  },

  async issue(input: MhdCertificateIssueInput): Promise<MhdCertificateIssueResult> {
    const { data, error } = await supabaseClient.rpc('mhd_certificate_issue', {
      p_company_id: input.companyId,
      p_template_id: input.templateId,
      p_person_id: input.personId,
      p_entity_type: input.entityType,
      p_entity_id: input.personId,
      p_merge_data: input.mergeData as Json,
      p_expires_at: input.expiresAt ?? undefined,
    });
    if (error) throw error;

    const row = ((data ?? []) as unknown as Array<{
      certificate_id: string;
      verification_code: string;
    }>)[0];
    if (!row) throw new Error('Certificate issuance returned no row.');

    return { certificateId: row.certificate_id, verificationCode: row.verification_code };
  },

  async revoke(certificateId: string, reason: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_certificate_revoke', {
      p_certificate_id: certificateId,
      p_reason: reason,
    });
    if (error) throw error;
  },
};
