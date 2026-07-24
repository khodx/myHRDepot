import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAdjustLeaveInput,
  MhdCreateLeaveCaseInput,
  MhdDesignateLeaveInput,
  MhdLeaveCaseBasisRpcRow,
  MhdLeaveCaseFilters,
  MhdLeaveCaseSummary,
  MhdLeaveCaseRpcRow,
  MhdLeaveCertification,
  MhdLeaveCertificationRpcRow,
  MhdLeaveLedgerEntry,
  MhdLeaveLedgerEntryRpcRow,
  MhdLeaveType,
  MhdLeaveTypeId,
  MhdLeaveTypeRpcRow,
  MhdMarkCertificationInput,
  MhdMutationResult,
  MhdRecordCertificationInput,
  MhdSetLeaveCaseBasesInput,
  MhdTransitionLeaveCaseInput,
} from './Types';
import { mhdToNumber } from './Types';

const leavesRpc = supabaseClient.rpc.bind(supabaseClient);

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

function mapLeaveType(row: MhdLeaveTypeRpcRow): MhdLeaveType {
  return {
    id: row.id,
    companyId: row.company_id,
    typeKey: row.type_key,
    typeName: row.type_name,
    jurisdiction: row.jurisdiction as MhdLeaveType['jurisdiction'],
    // Null-distinct from 0: a basis with no fixed cap (PER_EVENT / NONE) must
    // not read as a zero entitlement.
    entitlementHours: row.entitlement_hours == null ? null : mhdToNumber(row.entitlement_hours),
    measurementMethod: row.measurement_method as MhdLeaveType['measurementMethod'],
    measurementMonths: row.measurement_months,
    requiresCertification: row.requires_certification,
    citation: row.citation,
    isGlobal: row.is_global,
  };
}

function mapCaseSummary(row: MhdLeaveCaseRpcRow): MhdLeaveCaseSummary {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdLeaveCaseSummary['referenceId'],
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    reasonCategory: row.reason_category,
    status: row.status as MhdLeaveCaseSummary['status'],
    requestedStart: row.requested_start,
    requestedEnd: row.requested_end,
    basisCount: mhdToNumber(row.basis_count),
  };
}

function mapLedgerEntry(row: MhdLeaveLedgerEntryRpcRow): MhdLeaveLedgerEntry {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdLeaveLedgerEntry['referenceId'],
    leaveTypeId: row.leave_type_id,
    typeName: row.type_name,
    leaveCaseId: row.leave_case_id,
    entryType: row.entry_type as MhdLeaveLedgerEntry['entryType'],
    hoursDelta: mhdToNumber(row.hours_delta),
    effectiveDate: row.effective_date,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

function mapCertification(row: MhdLeaveCertificationRpcRow): MhdLeaveCertification {
  return {
    id: row.id,
    certificationType: row.certification_type as MhdLeaveCertification['certificationType'],
    dueDate: row.due_date,
    receivedAt: row.received_at,
    sufficient: row.sufficient,
    // These arrive already masked to null for a non-PA/HRP caller; the mapper
    // copies them through verbatim and never infers a value for them.
    providerNote: row.provider_note,
    driveFileId: row.drive_file_id,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdLeavesService = {
  // ----- Leave types (the catalog) -----

  async listLeaveTypes(companyId: string): Promise<MhdLeaveType[]> {
    const { data, error } = await leavesRpc('mhd_leave_type_list', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdLeaveTypeRpcRow[]).map(mapLeaveType);
  },

  // ----- Cases -----

  async listCases(filters: MhdLeaveCaseFilters): Promise<MhdLeaveCaseSummary[]> {
    if (!filters.companyId) return [];
    const { data, error } = await leavesRpc('mhd_leave_case_list', {
      p_company_id: filters.companyId,
      p_person_id: filters.personId ?? undefined,
      p_status: filterValueOrUndefined(filters.status),
    });
    if (error) throw error;
    return ((data ?? []) as MhdLeaveCaseRpcRow[]).map(mapCaseSummary);
  },

  async createCase(input: MhdCreateLeaveCaseInput): Promise<MhdMutationResult> {
    const { data, error } = await leavesRpc('mhd_leave_case_create', {
      p_company_id: input.companyId,
      p_person_id: input.personId,
      p_reason_category: input.reasonCategory.trim(),
      p_requested_start: input.requestedStart ?? undefined,
      p_requested_end: input.requestedEnd ?? undefined,
      p_is_intermittent: input.isIntermittent ?? false,
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Leave case creation returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  /**
   * Replace the case's designation set. In v1 this set is the administrator's
   * explicit choice (the auto-qualification engine is v2); the array is the
   * full set, so an omitted type is a removed basis.
   */
  async setCaseBases(input: MhdSetLeaveCaseBasesInput): Promise<void> {
    const { error } = await leavesRpc('mhd_leave_case_set_bases', {
      p_case_id: input.caseId,
      p_type_ids: input.leaveTypeIds,
    });
    if (error) throw error;
  },

  /**
   * A case's designated bases — the concurrency set. Read through the contract
   * (`mhd_leave_case_get_bases`), not a direct table select: the house rule is
   * contract-only access, and an RPC keeps the whole service on one surface. The
   * basis set is non-medical (which laws a case counts against), so it sits
   * outside the certification partition.
   */
  async listCaseBases(caseId: string): Promise<MhdLeaveTypeId[]> {
    const { data, error } = await leavesRpc('mhd_leave_case_get_bases', { p_case_id: caseId });
    if (error) throw error;
    return ((data ?? []) as MhdLeaveCaseBasisRpcRow[]).map((row) => row.leave_type_id);
  },

  async transitionCase(input: MhdTransitionLeaveCaseInput): Promise<void> {
    const { error } = await leavesRpc('mhd_leave_case_transition', {
      p_case_id: input.caseId,
      p_new_status: input.newStatus,
      p_decision_reason: trimmedOrUndefined(input.decisionReason),
    });
    if (error) throw error;
  },

  // ----- Ledger — the per-basis decrement (v1 = explicit) -----

  /**
   * Designate hours against the case's whole basis set. Returns the number of
   * ledger rows written — one per designated basis. This is the concurrency
   * mechanism: a single call against a case designated FMLA+PDL decrements both
   * clocks, which is exactly what a single running counter could never do.
   */
  async designate(input: MhdDesignateLeaveInput): Promise<number> {
    const { data, error } = await leavesRpc('mhd_leave_designate', {
      p_case_id: input.caseId,
      p_hours: input.hours,
      p_effective_date: input.effectiveDate,
    });
    if (error) throw error;
    return mhdToNumber(data as number | string);
  },

  async adjust(input: MhdAdjustLeaveInput): Promise<string> {
    const { data, error } = await leavesRpc('mhd_leave_adjust', {
      p_person_id: input.personId,
      p_leave_type_id: input.leaveTypeId,
      p_hours_delta: input.hoursDelta,
      p_reason: input.reason.trim(),
      p_effective_date: input.effectiveDate ?? undefined,
    });
    if (error) throw error;
    return data as string;
  },

  /**
   * Remaining hours for ONE basis, as of a date. Independent per leave type —
   * calling it per designated basis (never summing the results) is what keeps
   * FMLA, CFRA and PDL on separate clocks.
   */
  async balance(personId: string, leaveTypeId: string, asOf?: string | null): Promise<number> {
    const { data, error } = await leavesRpc('mhd_leave_balance', {
      p_person_id: personId,
      p_leave_type_id: leaveTypeId,
      p_as_of: asOf ?? undefined,
    });
    if (error) throw error;
    return mhdToNumber(data as number | string);
  },

  async listLedger(personId: string, leaveTypeId?: string | null): Promise<MhdLeaveLedgerEntry[]> {
    const { data, error } = await leavesRpc('mhd_leave_list_ledger', {
      p_person_id: personId,
      p_leave_type_id: leaveTypeId ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdLeaveLedgerEntryRpcRow[]).map(mapLedgerEntry);
  },

  // ----- Certifications — behind the tighter medical gate -----

  /**
   * List a case's certifications. The RPC returns `providerNote` and
   * `driveFileId` as NULL to anyone who is not PA/HRP — the mask is applied
   * server-side, so this service does no filtering of its own and the caller
   * must not assume it can see the medical fields. Pair the result with a
   * `canSeeMedical` flag from the route to render honestly.
   */
  async listCertifications(caseId: string): Promise<MhdLeaveCertification[]> {
    const { data, error } = await leavesRpc('mhd_leave_cert_list', {
      p_case_id: caseId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdLeaveCertificationRpcRow[]).map(mapCertification);
  },

  async recordCertification(input: MhdRecordCertificationInput): Promise<string> {
    const { data, error } = await leavesRpc('mhd_leave_cert_record', {
      p_case_id: input.caseId,
      p_certification_type: input.certificationType,
      p_due_date: input.dueDate ?? undefined,
    });
    if (error) throw error;
    return data as string;
  },

  async markCertificationSufficient(input: MhdMarkCertificationInput): Promise<void> {
    const { error } = await leavesRpc('mhd_leave_cert_mark_sufficient', {
      p_cert_id: input.certId,
      p_sufficient: input.sufficient,
      p_received_at: input.receivedAt ?? undefined,
      // Restricted medical detail — only a PA/HRP caller ever reaches this path.
      p_provider_note: trimmedOrUndefined(input.providerNote),
    });
    if (error) throw error;
  },
};
