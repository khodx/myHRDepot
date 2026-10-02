import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAddGrievanceStepInput,
  MhdGrievanceDetail,
  MhdGrievanceDetailRpcRow,
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
};
