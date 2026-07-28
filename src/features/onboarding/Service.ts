import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdFormService } from '@/features/forms/Service';
import type { MhdForm } from '@/features/forms/Types';
import type {
  MhdOnboardingChecklistItem,
  MhdOnboardingChecklistStatus,
  MhdOnboardingChecklistUpsertInput,
  MhdOnboardingDocumentKey,
  MhdOnboardingPacketFormRef,
  MhdOnboardingProgressSummary,
  MhdStartOnboardingPacketInput,
} from './Types';
import { MHD_ONBOARDING_PACKET_BY_KEY, MHD_ONBOARDING_PACKET_DEFINITIONS } from './Types';

type MhdOnboardingChecklistRow = {
  id: string;
  reference_id: string;
  company_id: string;
  person_id: string;
  document_key: string;
  document_record_id: string | null;
  status: MhdOnboardingChecklistStatus;
  is_required: boolean;
  due_date: string | null;
  completed_at: string | null;
};

type MhdDestinationRecordLookupRow = {
  id: string;
};

type MhdApplyDestinationRow = {
  destination_record_id: string | null;
};

type MhdOnboardingProgressRow = {
  person_id: string;
  total_items: number;
  required_items: number;
  required_completed: number;
  submitted_count: number;
  signed_count: number;
  voided_count: number;
  next_due_date: string | null;
  last_activity_at: string | null;
};

type MhdOnboardingTableName = MhdOnboardingDocumentKey;

function mapProgressRow(row: MhdOnboardingProgressRow): MhdOnboardingProgressSummary {
  return {
    personId: row.person_id,
    totalItems: row.total_items,
    requiredItems: row.required_items,
    requiredCompleted: row.required_completed,
    submittedCount: row.submitted_count,
    signedCount: row.signed_count,
    voidedCount: row.voided_count,
    nextDueDate: row.next_due_date,
    lastActivityAt: row.last_activity_at,
  };
}

function mapChecklistRow(row: MhdOnboardingChecklistRow): MhdOnboardingChecklistItem {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    personId: row.person_id,
    documentKey: row.document_key as MhdOnboardingDocumentKey,
    documentRecordId: row.document_record_id,
    status: row.status,
    isRequired: row.is_required,
    dueDate: row.due_date,
    completedAt: row.completed_at,
  };
}

async function findDestinationRecordIdForSubmission(
  documentKey: MhdOnboardingDocumentKey,
  submissionId: string,
): Promise<string | null> {
  const tableName = getOnboardingTableName(documentKey);
  const { data, error } = await supabaseClient
    .from(tableName)
    .select('id')
    .eq('form_submission_id', submissionId)
    .limit(1)
    .returns<MhdDestinationRecordLookupRow[]>();

  if (error) {
    throw new Error(
      `Unable to locate onboarding destination record for ${documentKey}: ${error.message}`,
    );
  }

  return data?.[0]?.id ?? null;
}

function getOnboardingTableName(documentKey: MhdOnboardingDocumentKey): MhdOnboardingTableName {
  return MHD_ONBOARDING_PACKET_BY_KEY[documentKey].documentKey;
}

async function createDestinationRecordPlaceholder(
  input: MhdOnboardingChecklistUpsertInput,
): Promise<string> {
  const tableName = getOnboardingTableName(input.documentKey);
  const { data, error } = await supabaseClient
    .from(tableName)
    .insert({
      reference_id: '',
      company_id: input.companyId,
      person_id: input.personId,
      form_submission_id: input.submissionId,
      status: input.status ?? 'SUBMITTED',
      created_by: input.actorUserId,
      updated_by: input.actorUserId,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(
      `Unable to create onboarding destination record for ${input.documentKey}: ${error.message}`,
    );
  }

  if (!data?.id) {
    throw new Error(
      `Unable to create onboarding destination record for ${input.documentKey}: no record returned.`,
    );
  }

  return data.id;
}

async function applySubmissionToDestination(
  documentKey: MhdOnboardingDocumentKey,
  submissionId: string,
): Promise<string | null> {
  const { data, error } = await supabaseClient
    .rpc('mhd_apply_form_submission_to_destination', {
      p_submission_id: submissionId,
    })
    .returns<MhdApplyDestinationRow[]>();

  if (error) {
    throw new Error(`Unable to apply submitted form to ${documentKey}: ${error.message}`);
  }

  return data?.[0]?.destination_record_id ?? null;
}

export const mhdOnboardingService = {
  async getChecklistForPerson(personId: string): Promise<MhdOnboardingChecklistItem[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_get_onboarding_checklist_for_person', { p_person_id: personId })
      .returns<MhdOnboardingChecklistRow[]>();

    if (error) {
      throw new Error(`Unable to load onboarding checklist: ${error.message}`);
    }

    return (data ?? []).map(mapChecklistRow);
  },

  async upsertChecklistItemFromSubmittedForm(
    input: MhdOnboardingChecklistUpsertInput,
  ): Promise<MhdOnboardingChecklistItem> {
    let documentRecordId = await findDestinationRecordIdForSubmission(
      input.documentKey,
      input.submissionId,
    );
    if (!documentRecordId) {
      documentRecordId = await createDestinationRecordPlaceholder(input);
    }

    documentRecordId =
      (await applySubmissionToDestination(input.documentKey, input.submissionId)) ??
      (await findDestinationRecordIdForSubmission(input.documentKey, input.submissionId)) ??
      documentRecordId;

    const { data, error } = await supabaseClient
      .rpc('mhd_upsert_onboarding_checklist_item', {
        p_company_id: input.companyId,
        p_person_id: input.personId,
        p_document_key: input.documentKey,
        p_document_record_id: documentRecordId,
        p_status: input.status ?? 'SUBMITTED',
        p_actor_user_id: input.actorUserId,
      })
      .returns<MhdOnboardingChecklistRow[]>();

    if (error) {
      throw new Error(`Unable to update onboarding checklist: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to update onboarding checklist: no record returned.');
    }

    return mapChecklistRow(row);
  },

  async startPacket(input: MhdStartOnboardingPacketInput): Promise<MhdOnboardingChecklistItem[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_start_onboarding_packet', {
        p_company_id: input.companyId,
        p_person_id: input.personId,
        p_document_keys: input.documentKeys,
        // The generator types p_due_date as non-null because the SQL argument
        // carries no DEFAULT, but mhd_start_onboarding_packet inserts it
        // straight into a nullable due_date column, so NULL is a legitimate
        // "no due date" rather than a missing argument. Same compatibility cast
        // as the Forms employee-file category arguments.
        p_due_date: input.dueDate as never,
        p_actor_user_id: input.actorUserId,
      })
      .returns<MhdOnboardingChecklistRow[]>();

    if (error) {
      throw new Error(`Unable to start the onboarding packet: ${error.message}`);
    }

    return (data ?? []).map(mapChecklistRow);
  },

  async listProgressForCompany(companyId: string): Promise<MhdOnboardingProgressSummary[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_onboarding_progress_for_company', { p_company_id: companyId })
      .returns<MhdOnboardingProgressRow[]>();

    if (error) {
      throw new Error(`Unable to load onboarding progress: ${error.message}`);
    }

    return (data ?? []).map(mapProgressRow);
  },

  async listPacketFormsForCompany(companyId: string): Promise<MhdOnboardingPacketFormRef[]> {
    const forms = await mhdFormService.listFormsForCompany(companyId, 'ACTIVE');
    const byName = new Map(forms.map((form) => [form.name, form]));

    return MHD_ONBOARDING_PACKET_DEFINITIONS.flatMap((packet): MhdOnboardingPacketFormRef[] => {
      const form = byName.get(packet.formName);
      if (!form) return [];
      return [mapFormToPacketRef(form)];
    });
  },

  /**
   * Bulk-cancels a person's onboarding packet (migration 0091,
   * mhd_onboarding_cancel_person). Voids every checklist item still
   * NOT_STARTED, PENDING, or SUBMITTED; SIGNED items are left untouched
   * server-side because they are already-executed documents. Returns the
   * number of items voided.
   */
  async cancelOnboarding(personId: string, reason: string): Promise<number> {
    const { data, error } = await supabaseClient.rpc('mhd_onboarding_cancel_person', {
      p_person_id: personId,
      p_reason: reason,
    });

    if (error) {
      throw new Error(`Unable to cancel onboarding: ${error.message}`);
    }

    return data ?? 0;
  },
};

function mapFormToPacketRef(form: MhdForm): MhdOnboardingPacketFormRef {
  return {
    formId: form.id,
    formReferenceId: form.referenceId,
    formName: form.name,
    formStatus: form.status,
  };
}
