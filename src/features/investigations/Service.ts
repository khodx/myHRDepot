import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAddPartyInput,
  MhdAssignInvestigatorInput,
  MhdCreateInvestigationInput,
  MhdInvestigationCaseDetail,
  MhdInvestigationCaseDetailRpcRow,
  MhdInvestigationCaseFilters,
  MhdInvestigationCaseRpcRow,
  MhdInvestigationCaseSummary,
  MhdInvestigationConflict,
  MhdInvestigationGrant,
  MhdInvestigationGrantInput,
  MhdInvestigationGrantRpcRow,
  MhdInvestigationInterimMeasure,
  MhdInvestigationInterimMeasureRpcRow,
  MhdInvestigationInterimMeasureType,
  MhdInvestigationMutationRpcRow,
  MhdInvestigationParty,
  MhdInvestigationPartyRpcRow,
  MhdMutationResult,
  MhdOpenInvestigationIntakeInput,
  MhdTransitionInvestigationInput,
} from './Types';

// Contract-only access. Every method below calls `.rpc()` and nothing else —
// there is not a single `supabaseClient.from('investigation_*')` select in this
// service. The whole surface is security-definer RPCs; RLS would refuse a direct
// table select regardless, and the grant model is enforced inside each function.
// supabaseClient.rpc is called directly rather than bound to a local alias.
// Binding instantiates the whole generated rpc overload set at once, which now
// exceeds the TypeScript instantiation depth limit (TS2589) at this schema size.
// A direct call instantiates only the matching overload, so argument and return
// types remain fully checked.

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function filterValueOrUndefined(value?: string | null): string | undefined {
  if (!value || value === 'ALL') return undefined;
  return value;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapCaseSummary(row: MhdInvestigationCaseRpcRow): MhdInvestigationCaseSummary {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdInvestigationCaseSummary['referenceId'],
    caseType: row.case_type as MhdInvestigationCaseSummary['caseType'],
    status: row.status as MhdInvestigationCaseSummary['status'],
    severity: row.severity,
    confidentialityLevel:
      row.confidentiality_level as MhdInvestigationCaseSummary['confidentialityLevel'],
    disposition: row.disposition as MhdInvestigationCaseSummary['disposition'],
    assignedInvestigatorUserId: row.assigned_investigator_user_id,
    createdAt: row.created_at,
  };
}

function mapCaseDetail(row: MhdInvestigationCaseDetailRpcRow): MhdInvestigationCaseDetail {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdInvestigationCaseDetail['referenceId'],
    companyId: row.company_id,
    caseType: row.case_type as MhdInvestigationCaseDetail['caseType'],
    status: row.status as MhdInvestigationCaseDetail['status'],
    severity: row.severity,
    confidentialityLevel:
      row.confidentiality_level as MhdInvestigationCaseDetail['confidentialityLevel'],
    disposition: row.disposition as MhdInvestigationCaseDetail['disposition'],
    assignedInvestigatorUserId: row.assigned_investigator_user_id,
    findingSummary: row.finding_summary,
    openedBy: row.opened_by,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGrant(row: MhdInvestigationGrantRpcRow): MhdInvestigationGrant {
  return {
    userId: row.user_id,
    grantedAt: row.granted_at,
    grantedBy: row.granted_by,
  };
}

function mapParty(row: MhdInvestigationPartyRpcRow): MhdInvestigationParty {
  return {
    id: row.id,
    partyRole: row.party_role as MhdInvestigationParty['partyRole'],
    // `person_id` and `display_name` arrive already masked for a confidential
    // party (null / '(confidential)'). The mapper copies them through verbatim
    // and never infers or re-derives identity — the server is the only place
    // masking happens.
    personId: row.person_id,
    displayName: row.display_name,
    isConfidential: row.is_confidential,
    hasStatement: row.has_statement,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdInvestigationsService = {
  // ----- Cases -----

  /**
   * Grant-filtered list. An ungranted caller (any role, including Client Admin)
   * gets an EMPTY set, never an error — a case they cannot see does not exist to
   * them. The empty array is the correct, unremarkable state for a fresh admin.
   */
  async listCases(filters: MhdInvestigationCaseFilters): Promise<MhdInvestigationCaseSummary[]> {
    if (!filters.companyId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_investigation_list', {
      p_company_id: filters.companyId,
      p_status: filterValueOrUndefined(filters.status),
    });
    if (error) throw error;
    return ((data ?? []) as MhdInvestigationCaseRpcRow[]).map(mapCaseSummary);
  },

  /**
   * Single-case detail — the full record MINUS the allegation ciphertext. `get`
   * deliberately never returns the ciphertext; the allegation is fetched only
   * through `revealAllegation`, on an explicit user action.
   */
  async getCase(caseId: string): Promise<MhdInvestigationCaseDetail | null> {
    const { data, error } = await supabaseClient.rpc('mhd_investigation_get', {
      p_case_id: caseId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdInvestigationCaseDetailRpcRow[])[0];
    return row ? mapCaseDetail(row) : null;
  },

  async createCase(input: MhdCreateInvestigationInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_investigation_create', {
      p_company_id: input.companyId,
      p_case_type: input.caseType,
      p_allegation: input.allegation.trim(),
      p_assigned_investigator: trimmedOrUndefined(input.assignedInvestigator),
      p_severity: trimmedOrUndefined(input.severity),
      p_confidentiality: input.confidentiality ?? 'STANDARD',
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Investigation creation returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  /**
   * The only ciphertext→plaintext path for the allegation. Re-checks the grant
   * and audits the reveal (content-free) on every call — so it must be triggered
   * by a deliberate user action, never fetched on mount.
   */
  // -------------------------------------------------------------------------
  // Intake wizard (0366)
  // -------------------------------------------------------------------------

  /** The independence check: findings are recommendations, a blocking one needs a recorded reason. */
  async checkConflicts(input: {
    companyId: string;
    investigatorUserId: string | null;
    partyPersonIds: string[];
    respondentPersonIds: string[];
  }): Promise<MhdInvestigationConflict[]> {
    if (!input.investigatorUserId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_investigation_check_conflicts', {
      p_company_id: input.companyId,
      p_investigator_user_id: input.investigatorUserId,
      p_party_person_ids: input.partyPersonIds,
      p_respondent_person_ids: input.respondentPersonIds,
    });
    if (error) throw new Error(`Unable to check the investigator's independence: ${error.message}`);
    const raw = data as { conflicts?: Array<Record<string, unknown>> } | null;
    return (raw?.conflicts ?? []).map((conflict) => ({
      code: String(conflict.code),
      severity: conflict.severity === 'BLOCKING' ? 'BLOCKING' : 'ADVISORY',
      personId: String(conflict.person_id),
      message: String(conflict.message),
    }));
  },

  /** Opens the case, its parties, source link, deadline and interim measures in one transaction. */
  async openFromIntake(input: MhdOpenInvestigationIntakeInput): Promise<MhdMutationResult> {
    const { data, error } = await supabaseClient.rpc('mhd_investigation_intake_open', {
      p_company_id: input.companyId,
      p_case_type: input.caseType,
      p_allegation: input.allegation,
      ...(input.severity ? { p_severity: input.severity } : {}),
      ...(input.confidentiality ? { p_confidentiality: input.confidentiality } : {}),
      ...(input.assignedInvestigatorUserId
        ? { p_assigned_investigator: input.assignedInvestigatorUserId }
        : {}),
      p_parties: (input.parties ?? []).map((party) => ({
        party_role: party.partyRole,
        person_id: party.personId ?? null,
        external_name: party.externalName ?? null,
        is_confidential: party.isConfidential ?? false,
        statement: party.statement ?? null,
      })),
      ...(input.sourceType && input.sourceId
        ? { p_source_type: input.sourceType, p_source_id: input.sourceId }
        : {}),
      ...(input.targetCompletionDate ? { p_target_completion_date: input.targetCompletionDate } : {}),
      p_interim_measures: (input.interimMeasures ?? []).map((measure) => ({
        measure_type: measure.measureType,
        description: measure.description,
        effective_from: measure.effectiveFrom ?? null,
        review_by: measure.reviewBy ?? null,
      })),
      ...(input.conflictAcknowledgment ? { p_conflict_acknowledgment: input.conflictAcknowledgment } : {}),
    });
    if (error) throw new Error(`Unable to open the investigation: ${error.message}`);
    const row = ((data ?? []) as unknown as MhdInvestigationMutationRpcRow[])[0];
    if (!row) throw new Error('Unable to open the investigation: no record returned.');
    return { id: row.id, referenceId: row.reference_id as MhdMutationResult['referenceId'] };
  },

  async listInterimMeasures(caseId: string): Promise<MhdInvestigationInterimMeasure[]> {
    const { data, error } = await supabaseClient.rpc('mhd_investigation_list_interim_measures', {
      p_case_id: caseId,
    });
    if (error) throw new Error(`Unable to load interim measures: ${error.message}`);
    return ((data ?? []) as unknown as MhdInvestigationInterimMeasureRpcRow[]).map((row) => ({
      id: row.id,
      measureType: row.measure_type as MhdInvestigationInterimMeasureType,
      description: row.description,
      effectiveFrom: row.effective_from,
      reviewBy: row.review_by,
      status: row.status === 'LIFTED' ? 'LIFTED' : 'ACTIVE',
      createdAt: row.created_at,
    }));
  },

  async revealAllegation(caseId: string): Promise<string | null> {
    const { data, error } = await supabaseClient.rpc('mhd_investigation_reveal_allegation', {
      p_case_id: caseId,
    });
    if (error) throw error;
    return (data as string | null) ?? null;
  },

  async transitionCase(input: MhdTransitionInvestigationInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_investigation_transition', {
      p_case_id: input.caseId,
      p_new_status: input.newStatus,
      p_disposition: input.disposition ?? undefined,
      p_finding: trimmedOrUndefined(input.finding),
    });
    if (error) throw error;
  },

  async assignInvestigator(input: MhdAssignInvestigatorInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_investigation_assign', {
      p_case_id: input.caseId,
      p_investigator: input.investigator,
    });
    if (error) throw error;
  },

  // ----- Grants — the access model itself -----

  async listGrants(caseId: string): Promise<MhdInvestigationGrant[]> {
    const { data, error } = await supabaseClient.rpc('mhd_investigation_list_grants', {
      p_case_id: caseId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdInvestigationGrantRpcRow[]).map(mapGrant);
  },

  /**
   * Grant a user access. Grant-holder-only at the RPC (access to grant access is
   * access); an ungranted admin cannot grant themselves in.
   */
  async grantAccess(input: MhdInvestigationGrantInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_investigation_grant_access', {
      p_case_id: input.caseId,
      p_user_id: input.userId,
    });
    if (error) throw error;
  },

  async revokeAccess(input: MhdInvestigationGrantInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_investigation_revoke_access', {
      p_case_id: input.caseId,
      p_user_id: input.userId,
    });
    if (error) throw error;
  },

  // ----- Parties -----

  /**
   * List a case's parties. Confidential identities arrive already masked from the
   * server (`person_id = null`, `display_name = '(confidential)'`); this service
   * does no filtering of its own and the caller must render the masked shape
   * verbatim.
   */
  async listParties(caseId: string): Promise<MhdInvestigationParty[]> {
    const { data, error } = await supabaseClient.rpc('mhd_investigation_list_parties', {
      p_case_id: caseId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdInvestigationPartyRpcRow[]).map(mapParty);
  },

  async addParty(input: MhdAddPartyInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_investigation_add_party', {
      p_case_id: input.caseId,
      p_party_role: input.partyRole,
      p_person_id: trimmedOrUndefined(input.personId),
      p_external_name: trimmedOrUndefined(input.externalName),
      p_is_confidential: input.isConfidential ?? false,
      p_statement: trimmedOrUndefined(input.statement),
    });
    if (error) throw error;
    return data as string;
  },

  /**
   * The gated statement reveal — the same deliberate, audited path as the
   * allegation, keyed on the party rather than the case. Never fetched on mount.
   */
  async revealStatement(partyId: string): Promise<string | null> {
    const { data, error } = await supabaseClient.rpc('mhd_investigation_reveal_statement', {
      p_party_id: partyId,
    });
    if (error) throw error;
    return (data as string | null) ?? null;
  },
};
