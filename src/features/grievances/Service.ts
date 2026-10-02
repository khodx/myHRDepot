import { supabaseClient } from '@/lib/supabase/supabaseClient';
import { mhdEsignatureService } from '@/features/esignature/Service';
import type {
  MhdAddGrievanceStepInput,
  MhdGrievanceDetail,
  MhdGrievanceCategory,
  MhdGrievanceDetailRpcRow,
  MhdGrievanceIntakeDetail,
  MhdGrievanceIntakeInput,
  MhdGrievanceIntakeResult,
  MhdGrievanceListFilters,
  MhdGrievanceListItem,
  MhdGrievanceListRpcRow,
  MhdGrievanceStatus,
  MhdGrievanceStep,
  MhdGrievanceStepRpcRow,
  MhdMyGrievance,
  MhdMyGrievanceRpcRow,
  MhdRejectGrievanceInput,
  MhdReferGrievanceInput,
  MhdRequestGrievanceSignatureInput,
  MhdResolveGrievanceInput,
  MhdSubmitGrievanceInput,
} from './Types';

// Contract-only access, matching Investigations/Conduct — every method calls
// `.rpc()` and nothing else. 0312 revoked the direct `select` grant that 0072
// had left on both tables specifically to make this the only path.

function mapListItem(row: MhdGrievanceListRpcRow): MhdGrievanceListItem {
  return {
    id: row.id,
    referenceId: row.reference_id,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    status: row.status as MhdGrievanceStatus,
    isHarassmentRelated: row.is_harassment_related,
    submittedAt: row.submitted_at,
    acknowledgedAt: row.acknowledged_at,
    referredToProcess: row.referred_to_process,
    referredAt: row.referred_at,
    resolutionAt: row.resolution_at,
    closedAt: row.closed_at,
  };
}

function mapMyGrievance(row: MhdMyGrievanceRpcRow): MhdMyGrievance {
  return {
    id: row.id,
    referenceId: row.reference_id,
    status: row.status as MhdGrievanceStatus,
    submittedAt: row.submitted_at,
    acknowledgedAt: row.acknowledged_at,
    referredToProcess: row.referred_to_process,
    resolutionAt: row.resolution_at,
    closedAt: row.closed_at,
  };
}

function mapDetail(row: MhdGrievanceDetailRpcRow): MhdGrievanceDetail {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    personId: row.person_id,
    status: row.status as MhdGrievanceStatus,
    grievanceWho: row.grievance_who,
    grievanceWhat: row.grievance_what,
    grievanceWhere: row.grievance_where,
    grievanceWhen: row.grievance_when,
    grievanceWhy: row.grievance_why,
    disagreementExplanation: row.disagreement_explanation,
    remedyRequested: row.remedy_requested,
    concernsUnrecordedOralReprimand: row.concerns_unrecorded_oral_reprimand,
    isHarassmentRelated: row.is_harassment_related,
    referredToProcess: row.referred_to_process,
    referredToInvestigationId: row.referred_to_investigation_id ?? null,
    referredAt: row.referred_at,
    submittedAt: row.submitted_at,
    employeeSignatureName: row.employee_signature_name,
    employeeSignatureAt: row.employee_signature_at,
    acknowledgedAt: row.acknowledged_at,
    resolution: row.resolution,
    resolutionAt: row.resolution_at,
    closedAt: row.closed_at,
  };
}

function mapStep(row: MhdGrievanceStepRpcRow): MhdGrievanceStep {
  return {
    id: row.id,
    stepOrdinal: row.step_ordinal,
    stepName: row.step_name,
    handledBy: row.handled_by,
    handledByName: row.handled_by_name,
    handledAt: row.handled_at,
    stepOutcome: row.step_outcome,
    stepNotes: row.step_notes,
  };
}

export const mhdGrievancesService = {
  async listGrievances(filters: MhdGrievanceListFilters): Promise<MhdGrievanceListItem[]> {
    if (!filters.companyId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_grievance_list', {
      p_company_id: filters.companyId,
      p_status: filters.status ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdGrievanceListRpcRow[]).map(mapListItem);
  },

  async listMyGrievances(personId: string): Promise<MhdMyGrievance[]> {
    const { data, error } = await supabaseClient.rpc('mhd_grievance_list_mine', {
      p_person_id: personId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdMyGrievanceRpcRow[]).map(mapMyGrievance);
  },

  async getGrievance(grievanceId: string): Promise<MhdGrievanceDetail> {
    const { data, error } = await supabaseClient.rpc('mhd_grievance_get', {
      p_grievance_id: grievanceId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdGrievanceDetailRpcRow[])[0];
    if (!row) throw new Error('Grievance not found.');
    return mapDetail(row);
  },

  async listSteps(grievanceId: string): Promise<MhdGrievanceStep[]> {
    const { data, error } = await supabaseClient.rpc('mhd_grievance_list_steps', {
      p_grievance_id: grievanceId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdGrievanceStepRpcRow[]).map(mapStep);
  },

  async submitGrievance(input: MhdSubmitGrievanceInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_submit_grievance', {
      p_company_id: input.companyId,
      p_person_id: input.personId,
      p_grievance_what: input.grievanceWhat,
      p_disagreement_explanation: input.disagreementExplanation,
      p_remedy_requested: input.remedyRequested,
      p_employee_signature_name: input.employeeSignatureName,
      p_grievance_who: input.grievanceWho ?? undefined,
      p_grievance_where: input.grievanceWhere ?? undefined,
      p_grievance_when: input.grievanceWhen ?? undefined,
      p_grievance_why: input.grievanceWhy ?? undefined,
      p_is_harassment_related: input.isHarassmentRelated ?? false,
    });
    if (error) throw error;
    return data as string;
  },

  async acknowledgeGrievance(grievanceId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_grievance_acknowledge', {
      p_grievance_id: grievanceId,
    });
    if (error) throw error;
  },

  async addStep(input: MhdAddGrievanceStepInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_grievance_add_step', {
      p_grievance_id: input.grievanceId,
      p_step_ordinal: input.stepOrdinal,
      p_step_name: input.stepName,
      p_step_outcome: input.stepOutcome ?? undefined,
      p_step_notes: input.stepNotes ?? undefined,
      p_handled_at: input.handledAt ?? undefined,
    });
    if (error) throw error;
  },

  async referGrievance(input: MhdReferGrievanceInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_grievance_refer', {
      p_grievance_id: input.grievanceId,
      p_referred_to_process: input.referredToProcess,
      ...(input.investigationCaseId ? { p_investigation_case_id: input.investigationCaseId } : {}),
    });
    if (error) throw error;
  },

  async resolveGrievance(input: MhdResolveGrievanceInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_grievance_resolve', {
      p_grievance_id: input.grievanceId,
      p_resolution: input.resolution,
    });
    if (error) throw error;
  },

  async rejectGrievance(input: MhdRejectGrievanceInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_grievance_reject_not_grievable', {
      p_grievance_id: input.grievanceId,
      p_reason: input.reason,
    });
    if (error) throw error;
  },

  async withdrawGrievance(grievanceId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_grievance_withdraw', {
      p_grievance_id: grievanceId,
    });
    if (error) throw error;
  },
  // -------------------------------------------------------------------------
  // Intake wizard (0372)
  // -------------------------------------------------------------------------

  /** Files the grievance, its witnesses, the signature evidence and the audit trail in one transaction. */
  async openFromIntake(input: MhdGrievanceIntakeInput): Promise<MhdGrievanceIntakeResult> {
    const { data, error } = await supabaseClient.rpc('mhd_grievance_intake_open', {
      p_company_id: input.companyId,
      p_person_id: input.personId,
      p_grievance: {
        grievance_what: input.grievanceWhat,
        disagreement_explanation: input.disagreementExplanation,
        remedy_requested: input.remedyRequested,
        employee_signature_name: input.employeeSignatureName,
        grievance_category: input.grievanceCategory ?? null,
        person_grieved_against_id: input.personGrievedAgainstId ?? null,
        grievance_who: input.grievanceWho ?? null,
        grievance_where: input.grievanceWhere ?? null,
        grievance_when: input.grievanceWhen ?? null,
        grievance_why: input.grievanceWhy ?? null,
        steps_already_taken: input.stepsAlreadyTaken ?? null,
        is_harassment_related: input.isHarassmentRelated,
        retaliation_concern: input.retaliationConcern,
        concerns_unrecorded_oral_reprimand: input.concernsUnrecordedOralReprimand,
      },
      p_witnesses: input.witnesses.map((witness) => ({
        witness_name: witness.witnessName,
        witness_person_id: witness.witnessPersonId ?? null,
        what_they_know: witness.whatTheyKnow ?? null,
      })),
    });
    if (error) throw new Error(error.message);
    const raw = (data ?? {}) as Record<string, unknown>;
    return {
      id: String(raw.id),
      referenceId: String(raw.reference_id),
      status: raw.status as MhdGrievanceStatus,
      referred: Boolean(raw.referred),
    };
  },

  /** The category, who it concerns, what was tried, the retaliation concern and the witnesses. */
  async getIntakeDetail(grievanceId: string): Promise<MhdGrievanceIntakeDetail> {
    const { data, error } = await supabaseClient.rpc('mhd_grievance_get_intake_detail', {
      p_grievance_id: grievanceId,
    });
    if (error) throw new Error(`Unable to load the grievance detail: ${error.message}`);
    const raw = (data ?? {}) as Record<string, unknown>;
    return {
      grievanceCategory: (raw.grievance_category as MhdGrievanceCategory | null) ?? null,
      personGrievedAgainstId: (raw.person_grieved_against_id as string | null) ?? null,
      personGrievedAgainstName: (raw.person_grieved_against_name as string | null) ?? null,
      stepsAlreadyTaken: (raw.steps_already_taken as string | null) ?? null,
      retaliationConcern: Boolean(raw.retaliation_concern),
      witnesses: ((raw.witnesses as Array<Record<string, unknown>> | null) ?? []).map(
        (witness) => ({
          id: String(witness.id),
          witnessName: String(witness.witness_name),
          witnessPersonId: (witness.witness_person_id as string | null) ?? null,
          whatTheyKnow: (witness.what_they_know as string | null) ?? null,
        }),
      ),
    };
  },

  /** Asks the filer to sign the generated receipt in the app. */
  async requestFilerSignature(
    input: MhdRequestGrievanceSignatureInput,
  ): Promise<{ requestId: string; invitationErrors: string[] }> {
    const result = await mhdEsignatureService.createRequestFromGeneratedDocument({
      companyId: input.companyId,
      generationId: input.generationId,
      documentHash: input.documentHash,
      signers: [{ kind: 'internal', userId: input.userId }],
      signingOrder: 'SEQUENTIAL',
    });
    return { requestId: result.request.id, invitationErrors: result.invitationErrors };
  },
};
