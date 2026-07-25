import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Database, Json } from '@/types/database.types';
import type {
  MhdCaseDocument,
  MhdCaseDocumentMutationRpcRow,
  MhdCaseDocumentRpcRow,
  MhdCreateHrAdvisoryMemoInput,
  MhdGeneratedCaseDocumentResult,
  MhdHrAdvisoryMemoPayload,
  MhdUpdateCaseDocumentInput,
} from './Types';

const caseDocumentsRpc = supabaseClient.rpc.bind(supabaseClient);
const RENDER_DOCUMENT_FUNCTION_NAME = 'render-document';
const DEFAULT_GENERATION_POLL_ATTEMPTS = 10;
const DEFAULT_GENERATION_POLL_INTERVAL_MS = 1500;

type RpcResult = {
  data: unknown;
  error: { message: string } | null;
};

const caseDocumentsRpcUntyped = caseDocumentsRpc as unknown as (
  functionName: string,
  args: Record<string, unknown>,
) => Promise<RpcResult>;

interface RenderDocumentResponse {
  success?: boolean;
  error?: string;
}

type DocumentGenerationPollRow = Pick<
  Database['public']['Tables']['document_generations']['Row'],
  'id' | 'status' | 'output_drive_file_id' | 'output_document_hash'
>;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function trimOrNull(value?: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function htmlText(value?: string | null): string {
  return (trimOrNull(value) ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? {})) as Json;
}

function buildHrAdvisoryMemoMergeData(input: MhdHrAdvisoryMemoPayload): Record<string, unknown> {
  return {
    memo: {
      date: htmlText(input.memo?.date),
      to: htmlText(input.memo?.to),
      from: htmlText(input.memo?.from),
      subject: htmlText(input.memo?.subject),
    },
    company: {
      name: htmlText(input.company?.name),
    },
    subject_employee: {
      display_name: htmlText(input.subjectEmployee?.displayName),
      position_title: htmlText(input.subjectEmployee?.positionTitle),
      department_program: htmlText(input.subjectEmployee?.departmentProgram),
      date_of_hire: htmlText(input.subjectEmployee?.dateOfHire),
    },
    case: {
      reference_id: htmlText(input.case?.referenceId),
    },
    purpose: htmlText(input.purpose),
    background: htmlText(input.background),
    documented_incidents: htmlText(input.documentedIncidents),
    policy_handbook_violations: htmlText(input.policyHandbookViolations),
    state_law_considerations: htmlText(input.stateLawConsiderations),
    risk_assessment: htmlText(input.riskAssessment),
    aggravating_factors: htmlText(input.aggravatingFactors),
    mitigating_factors: htmlText(input.mitigatingFactors),
    employment_options: htmlText(input.employmentOptions),
    separation_considerations: htmlText(input.separationConsiderations),
    advisor_observations: htmlText(input.advisorObservations),
    prepared_by: {
      name: htmlText(input.preparedBy?.name),
      title: htmlText(input.preparedBy?.title),
    },
  };
}

function mapCaseDocument(row: MhdCaseDocumentRpcRow): MhdCaseDocument {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    sourceEntityType: row.source_entity_type as MhdCaseDocument['sourceEntityType'],
    sourceEntityId: row.source_entity_id,
    documentKind: row.document_kind as MhdCaseDocument['documentKind'],
    title: row.title,
    confidentialityLevel: row.confidentiality_level as MhdCaseDocument['confidentialityLevel'],
    payload: row.payload,
    status: row.status as MhdCaseDocument['status'],
    documentGenerationId: row.document_generation_id,
    generationStatus: row.generation_status as MhdCaseDocument['generationStatus'],
    outputDriveFileId: row.output_drive_file_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchGenerationUntilGenerated(
  generationId: string,
  attempts: number,
  intervalMs: number,
): Promise<DocumentGenerationPollRow> {
  let lastStatus = 'PENDING';

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0 && intervalMs > 0) {
      await delay(intervalMs);
    }

    const { data, error } = await supabaseClient
      .from('document_generations')
      .select('id, status, output_drive_file_id, output_document_hash')
      .eq('id', generationId)
      .maybeSingle<DocumentGenerationPollRow>();

    if (error) {
      throw new Error(`Unable to check document generation status: ${error.message}`);
    }
    if (!data) {
      throw new Error(`Document generation not found: ${generationId}`);
    }
    if (data.status === 'GENERATED') {
      return data;
    }
    if (data.status === 'FAILED') {
      throw new Error(
        'Document generation failed - see the generation record for the failure reason.',
      );
    }

    lastStatus = data.status;
  }

  throw new Error(`Document generation did not complete in time (last status: ${lastStatus}).`);
}

async function renderGeneration(generationId: string): Promise<void> {
  const { data, error } = await supabaseClient.functions.invoke<RenderDocumentResponse>(
    RENDER_DOCUMENT_FUNCTION_NAME,
    { body: { generation_id: generationId } },
  );
  if (error) {
    throw new Error(`Unable to render case document: ${error.message}`);
  }
  if (data?.success === false) {
    throw new Error(`Unable to render case document: ${data.error ?? 'Unknown error'}`);
  }
}

export const mhdCaseDocumentsService = {
  async listForSource(
    sourceEntityType: MhdCaseDocument['sourceEntityType'],
    sourceEntityId: string,
  ): Promise<MhdCaseDocument[]> {
    const { data, error } = await caseDocumentsRpcUntyped('mhd_list_case_documents_for_source', {
      p_source_entity_type: sourceEntityType,
      p_source_entity_id: sourceEntityId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdCaseDocumentRpcRow[]).map(mapCaseDocument);
  },

  async createHrAdvisoryMemo(input: MhdCreateHrAdvisoryMemoInput): Promise<MhdCaseDocument> {
    const { data, error } = await caseDocumentsRpcUntyped('mhd_create_case_document', {
      p_company_id: input.companyId,
      p_source_entity_type: input.sourceEntityType,
      p_source_entity_id: input.sourceEntityId,
      p_document_kind: 'HR_ADVISORY_MEMO',
      p_title: input.title.trim(),
      p_confidentiality_level: input.confidentialityLevel ?? 'RESTRICTED',
      p_payload: toJson(input.payload),
    });
    if (error) throw error;
    const created = ((data ?? []) as MhdCaseDocumentMutationRpcRow[])[0];
    if (!created) throw new Error('Case document creation returned no row.');

    const documents = await this.listForSource(input.sourceEntityType, input.sourceEntityId);
    const document = documents.find((candidate) => candidate.id === created.id);
    if (!document) throw new Error(`Created case document not found: ${created.id}`);
    return document;
  },

  async updateCaseDocument(input: MhdUpdateCaseDocumentInput): Promise<void> {
    const { error } = await caseDocumentsRpcUntyped('mhd_update_case_document', {
      p_case_document_id: input.caseDocumentId,
      p_title: trimOrNull(input.title),
      p_confidentiality_level: input.confidentialityLevel ?? null,
      p_payload: input.payload == null ? null : toJson(input.payload),
    });
    if (error) throw error;
  },

  async generateHrAdvisoryMemo(
    input: MhdCreateHrAdvisoryMemoInput,
    options?: { pollAttempts?: number; pollIntervalMs?: number },
  ): Promise<MhdGeneratedCaseDocumentResult> {
    const created = await this.createHrAdvisoryMemo(input);
    const mergeData = buildHrAdvisoryMemoMergeData(input.payload);

    const { data, error } = await caseDocumentsRpcUntyped('mhd_request_case_document_generation', {
      p_case_document_id: created.id,
      p_template_key: 'HR_ADVISORY_MEMO',
      p_merge_data: toJson(mergeData),
    });
    if (error) throw error;

    const requested = ((data ?? []) as MhdCaseDocumentMutationRpcRow[])[0];
    if (!requested?.document_generation_id) {
      throw new Error('Case document generation request returned no generation id.');
    }

    await renderGeneration(requested.document_generation_id);
    const generated = await fetchGenerationUntilGenerated(
      requested.document_generation_id,
      options?.pollAttempts ?? DEFAULT_GENERATION_POLL_ATTEMPTS,
      options?.pollIntervalMs ?? DEFAULT_GENERATION_POLL_INTERVAL_MS,
    );

    return {
      id: requested.id,
      referenceId: requested.reference_id,
      status: requested.status as MhdGeneratedCaseDocumentResult['status'],
      documentGenerationId: requested.document_generation_id,
      outputDriveFileId: generated.output_drive_file_id,
      outputDocumentHash: generated.output_document_hash,
    };
  },
};
