import { appConfig } from '@/config/appConfig';
import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdTaskService } from '@/features/tasks/Service';
import type {
  MhdCreateEsignatureRequestFromGenerationInput,
  MhdCreateEsignatureRequestResult,
  MhdEsignatureAssignableUser,
  MhdEsignatureEvent,
  MhdEsignatureGeneratedDocument,
  MhdEsignatureRequest,
  MhdEsignatureSigner,
  MhdSignatureConsentRecord,
  MhdSignatureRequestByToken,
} from './Types';

interface SignerRow {
  id: string;
  signer_order: number;
  user_id: string | null;
  external_email: string | null;
  external_name: string | null;
  status: string;
  signed_at: string | null;
  declined_reason: string | null;
  signature_name: string | null;
  consented_at: string | null;
}

interface RequestRow {
  id: string;
  reference_id: string;
  company_id: string;
  document_generation_id: string;
  document_name: string;
  document_drive_file_id: string;
  signed_drive_file_id: string | null;
  document_hash: string | null;
  signed_document_hash: string | null;
  disclosure_text: string;
  disclosure_version: string;
  signing_order: string;
  status: string;
  expires_at: string | null;
  completed_at: string | null;
  created_at: string;
  created_by: string | null;
  signers?: SignerRow[] | null;
}

interface GeneratedDocumentTemplateJoin {
  name: string | null;
  requires_signature: boolean | null;
}

interface GeneratedDocumentRow {
  id: string;
  reference_id: string;
  template_id: string;
  template_version: number;
  company_id: string;
  entity_type: string;
  entity_id: string;
  merge_data: Record<string, unknown> | null;
  status: 'PENDING' | 'GENERATED' | 'FAILED' | 'SIGNED' | 'VOIDED';
  output_file_name: string | null;
  output_drive_file_id: string | null;
  generated_at: string | null;
  esignature_request_id: string | null;
  document_templates: GeneratedDocumentTemplateJoin | GeneratedDocumentTemplateJoin[] | null;
}

interface SignatureEmailResponse {
  success?: boolean;
  error?: string;
}

function mapSigner(row: SignerRow): MhdEsignatureSigner {
  return {
    id: row.id,
    signerOrder: row.signer_order,
    userId: row.user_id,
    externalEmail: row.external_email,
    externalName: row.external_name,
    status: row.status as MhdEsignatureSigner['status'],
    signedAt: row.signed_at,
    declinedReason: row.declined_reason,
    signatureName: row.signature_name,
    consentedAt: row.consented_at,
  };
}

function mapRequest(row: RequestRow): MhdEsignatureRequest {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    documentGenerationId: row.document_generation_id,
    documentName: row.document_name,
    documentDriveFileId: row.document_drive_file_id,
    signedDriveFileId: row.signed_drive_file_id,
    documentHash: row.document_hash,
    signedDocumentHash: row.signed_document_hash,
    disclosureText: row.disclosure_text,
    disclosureVersion: row.disclosure_version,
    signingOrder: row.signing_order as MhdEsignatureRequest['signingOrder'],
    status: row.status as MhdEsignatureRequest['status'],
    expiresAt: row.expires_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
    signers: (row.signers ?? []).map(mapSigner),
  };
}

function mapGeneratedDocument(row: GeneratedDocumentRow): MhdEsignatureGeneratedDocument {
  const template = Array.isArray(row.document_templates)
    ? row.document_templates[0] ?? null
    : row.document_templates;

  return {
    id: row.id,
    referenceId: row.reference_id,
    templateId: row.template_id,
    templateVersion: row.template_version,
    templateName: template?.name?.trim() || row.output_file_name || 'Generated document',
    requiresSignature: template?.requires_signature ?? false,
    companyId: row.company_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status,
    outputFileName: row.output_file_name,
    outputDriveFileId: row.output_drive_file_id,
    generatedAt: row.generated_at,
    esignatureRequestId: row.esignature_request_id,
    mergeData: row.merge_data ?? {},
  };
}

async function invokeSignatureEmail(body: Record<string, unknown>): Promise<void> {
  const { data, error } = await supabaseClient.functions.invoke<SignatureEmailResponse>(
    appConfig.signatureEmailFunctionName,
    { body },
  );

  if (error) {
    throw new Error(error.message || 'Unable to invoke the signature email function.');
  }

  if (data?.success === false) {
    throw new Error(data.error || 'Signature email delivery failed.');
  }
}

export const mhdEsignatureService = {
  async listRequestsForCompany(companyId: string): Promise<MhdEsignatureRequest[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_signature_requests_for_company', { p_company_id: companyId })
      .returns<RequestRow[]>();

    if (error) {
      throw new Error(`Unable to load signature requests: ${error.message}`);
    }

    return (data ?? []).map(mapRequest);
  },

  async getRequest(requestId: string): Promise<MhdEsignatureRequest | null> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_signature_request', { p_request_id: requestId })
      .maybeSingle<RequestRow>();

    if (error) {
      throw new Error(`Unable to load signature request: ${error.message}`);
    }

    return data ? mapRequest(data) : null;
  },

  async getEvents(requestId: string): Promise<MhdEsignatureEvent[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_signature_events', { p_request_id: requestId })
      .returns<
        Array<{
          id: string;
          request_id: string;
          signer_id: string | null;
          event_type: string;
          event_at: string;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Record<string, unknown> | null;
        }>
      >();

    if (error) {
      throw new Error(`Unable to load signature events: ${error.message}`);
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      requestId: row.request_id,
      signerId: row.signer_id,
      eventType: row.event_type as MhdEsignatureEvent['eventType'],
      eventAt: row.event_at,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      metadata: row.metadata ?? {},
    }));
  },

  async listGeneratedDocuments(companyId: string, personId?: string | null): Promise<MhdEsignatureGeneratedDocument[]> {
    let query = supabaseClient
      .from('document_generations')
      .select(`
        id,
        reference_id,
        template_id,
        template_version,
        company_id,
        entity_type,
        entity_id,
        merge_data,
        status,
        output_file_name,
        output_drive_file_id,
        generated_at,
        esignature_request_id,
        document_templates:template_id (
          name,
          requires_signature
        )
      `)
      .eq('company_id', companyId)
      .not('output_drive_file_id', 'is', null)
      .order('generated_at', { ascending: false });

    if (personId) {
      query = query.eq('entity_type', 'PERSON').eq('entity_id', personId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Unable to load generated documents: ${error.message}`);
    }

    return ((data as GeneratedDocumentRow[] | null) ?? [])
      .map(mapGeneratedDocument)
      .filter((generation) => generation.status === 'GENERATED' && generation.requiresSignature);
  },

  async getGeneratedDocumentById(generationId: string): Promise<MhdEsignatureGeneratedDocument | null> {
    const { data, error } = await supabaseClient
      .from('document_generations')
      .select(`
        id,
        reference_id,
        template_id,
        template_version,
        company_id,
        entity_type,
        entity_id,
        merge_data,
        status,
        output_file_name,
        output_drive_file_id,
        generated_at,
        esignature_request_id,
        document_templates:template_id (
          name,
          requires_signature
        )
      `)
      .eq('id', generationId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load generated document: ${error.message}`);
    }

    return data ? mapGeneratedDocument(data as GeneratedDocumentRow) : null;
  },

  async listAssignableUsers(companyId: string): Promise<MhdEsignatureAssignableUser[]> {
    return mhdTaskService.listAssignableUsers(companyId);
  },

  async createRequestFromGeneratedDocument(
    input: MhdCreateEsignatureRequestFromGenerationInput,
  ): Promise<MhdCreateEsignatureRequestResult> {
    const generation = await this.getGeneratedDocumentById(input.generationId);

    if (!generation) {
      throw new Error(`Generated document not found: ${input.generationId}`);
    }
    if (generation.companyId !== input.companyId) {
      throw new Error('The selected generated document belongs to a different company.');
    }
    if (!generation.requiresSignature) {
      throw new Error('The selected generated document is not marked as requiring signature.');
    }
    if (generation.status !== 'GENERATED' || !generation.outputDriveFileId) {
      throw new Error('The selected document is not ready for signature routing yet.');
    }
    if (generation.esignatureRequestId) {
      throw new Error('This generated document already has a linked signature request.');
    }

    const { data, error } = await supabaseClient
      .rpc('mhd_create_signature_request', {
        p_company_id: input.companyId,
        p_document_generation_id: generation.id,
        p_document_name: generation.outputFileName || generation.templateName,
        p_document_drive_file_id: generation.outputDriveFileId,
        p_document_hash: input.documentHash.trim(),
        p_signers: input.signers.map((signer) =>
          signer.kind === 'internal'
            ? { user_id: signer.userId }
            : { external_email: signer.externalEmail, external_name: signer.externalName },
        ),
        p_signing_order: input.signingOrder,
        ...(input.expiresAt ? { p_expires_at: input.expiresAt } : {}),
        ...(input.disclosureText ? { p_disclosure_text: input.disclosureText } : {}),
        ...(input.disclosureVersion ? { p_disclosure_version: input.disclosureVersion } : {}),
      })
      .returns<Array<{ id: string; reference_id: string }>>();

    if (error) {
      throw new Error(`Unable to create signature request: ${error.message}`);
    }

    const row = data?.[0];
    if (!row?.id) {
      throw new Error('Unable to create signature request: no request id returned.');
    }

    const request = await this.getRequest(row.id);
    if (!request) {
      throw new Error(`Signature request created but could not be reloaded: ${row.id}`);
    }

    const actionableSigners = request.signers.filter((signer) => signer.signerOrder === 1);
    const invitationResults = await Promise.allSettled(
      actionableSigners.map((signer) => invokeSignatureEmail({ signer_id: signer.id })),
    );

    const invitationErrors = invitationResults.flatMap((result, index) => {
      if (result.status === 'fulfilled') return [];
      const signer = actionableSigners[index];
      return [`${signer.externalEmail ?? signer.externalName ?? signer.id}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`];
    });

    return { request, invitationErrors };
  },

  async sendReminder(signerId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_send_signature_reminder', { p_signer_id: signerId });
    if (error) {
      throw new Error(`Unable to queue a reminder: ${error.message}`);
    }

    await invokeSignatureEmail({ signer_id: signerId, reminder: true });
  },

  async voidRequest(requestId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_void_signature_request', { p_request_id: requestId });
    if (error) {
      throw new Error(`Unable to void signature request: ${error.message}`);
    }
  },

  async getRequestByToken(signingToken: string): Promise<MhdSignatureRequestByToken> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_signature_request_by_token', { p_signing_token: signingToken })
      .single();

    if (error) {
      throw new Error(error.message || 'Unable to load signing link.');
    }
    if (!data) {
      throw new Error('Invalid or expired signing link');
    }

    const row = data as {
      request_id: string;
      reference_id: string;
      document_name: string;
      document_drive_file_id: string;
      document_hash: string | null;
      signed_drive_file_id: string | null;
      disclosure_text: string;
      disclosure_version: string;
      request_status: string;
      signing_order: string;
      signer_id: string;
      signer_name: string;
      signer_status: string;
      signer_order_position: number;
      consented_at: string | null;
    };

    return {
      requestId: row.request_id,
      referenceId: row.reference_id,
      documentName: row.document_name,
      documentDriveFileId: row.document_drive_file_id,
      documentHash: row.document_hash,
      signedDriveFileId: row.signed_drive_file_id,
      disclosureText: row.disclosure_text,
      disclosureVersion: row.disclosure_version,
      requestStatus: row.request_status as MhdSignatureRequestByToken['requestStatus'],
      signingOrder: row.signing_order as MhdSignatureRequestByToken['signingOrder'],
      signerId: row.signer_id,
      signerName: row.signer_name,
      signerStatus: row.signer_status as MhdSignatureRequestByToken['signerStatus'],
      signerOrderPosition: row.signer_order_position,
      consentedAt: row.consented_at,
    };
  },

  async recordConsentViaToken(input: {
    signingToken: string;
    consentedToElectronicRecords: boolean;
    acknowledgedHardwareRequirements: boolean;
    acknowledgedPaperCopyRight: boolean;
    acknowledgedWithdrawalRight: boolean;
    agreedToUseElectronicSignature: boolean;
    userAgent?: string;
  }): Promise<MhdSignatureConsentRecord> {
    const { data, error } = await supabaseClient
      .rpc('mhd_record_signature_consent', {
        p_signing_token: input.signingToken,
        p_consented_to_electronic_records: input.consentedToElectronicRecords,
        p_acknowledged_hardware_requirements: input.acknowledgedHardwareRequirements,
        p_acknowledged_paper_copy_right: input.acknowledgedPaperCopyRight,
        p_acknowledged_withdrawal_right: input.acknowledgedWithdrawalRight,
        p_agreed_to_use_electronic_signature: input.agreedToUseElectronicSignature,
        ...(input.userAgent ? { p_user_agent: input.userAgent } : {}),
      })
      .single();

    if (error) {
      throw new Error(`Unable to record consent: ${error.message}`);
    }
    if (!data) {
      throw new Error('Unable to record consent: no response returned.');
    }

    return {
      requestId: (data as { request_id: string }).request_id,
      signerId: (data as { signer_id: string }).signer_id,
      consentedAt: (data as { consented_at: string }).consented_at,
    };
  },

  async signViaToken(input: {
    signingToken: string;
    typedSignatureName: string;
    intentToSign: boolean;
    presentedDocumentHash: string;
    userAgent?: string;
  }): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_sign_via_token', {
      p_signing_token: input.signingToken,
      p_typed_signature_name: input.typedSignatureName.trim(),
      p_intent_to_sign: input.intentToSign,
      p_presented_document_hash: input.presentedDocumentHash.trim(),
      ...(input.userAgent ? { p_user_agent: input.userAgent } : {}),
    });

    if (error) {
      throw new Error(`Unable to record signature: ${error.message}`);
    }
  },

  async declineViaToken(input: { signingToken: string; reason: string; userAgent?: string }): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_decline_via_token', {
      p_signing_token: input.signingToken,
      p_reason: input.reason.trim(),
      ...(input.userAgent ? { p_user_agent: input.userAgent } : {}),
    });

    if (error) {
      throw new Error(`Unable to decline signature request: ${error.message}`);
    }
  },
};
