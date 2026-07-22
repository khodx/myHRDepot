import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAddTripToClaimInput,
  MhdCreateClaimInput,
  MhdDecideClaimInput,
  MhdMarkClaimExportedInput,
  MhdMileageClaimDetail,
  MhdMileageClaimDetailRpcRow,
  MhdMileageClaimFilters,
  MhdMileageClaimLine,
  MhdMileageClaimLineJson,
  MhdMileageClaimRpcRow,
  MhdMileageClaimSummary,
  MhdMileageEffectiveRate,
  MhdMileageEffectiveRateRpcRow,
  MhdMileageRate,
  MhdMileageRateFilters,
  MhdMileageRateRpcRow,
  MhdMileageResolvedRate,
  MhdMileageResolvedRateRpcRow,
  MhdMileageTrip,
  MhdMileageTripFilters,
  MhdMileageTripRpcRow,
  MhdProposeRateInput,
  MhdRecordTripInput,
  MhdSetCompanyRatePolicyInput,
  MhdVoidTripInput,
} from './Types';
import { mhdToNumber } from './Types';

const mileageRpc = supabaseClient.rpc.bind(supabaseClient);

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function filterValueOrUndefined(value?: string | null): string | undefined {
  if (!value || value === 'ALL') return undefined;
  return value;
}

/**
 * Money and rates arrive as strings from PostgREST. Where the column is
 * nullable, null means "not stamped yet" and must survive as null rather than
 * collapsing to 0 — an unpriced draft line and a line priced at zero are
 * different facts.
 */
function numberOrNull(value: number | string | null | undefined): number | null {
  return value == null ? null : mhdToNumber(value);
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapRate(row: MhdMileageRateRpcRow): MhdMileageRate {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdMileageRate['referenceId'],
    category: row.category as MhdMileageRate['category'],
    ratePerMile: mhdToNumber(row.rate_per_mile),
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    status: row.status as MhdMileageRate['status'],
    sourceUrl: row.source_url,
    noticeNumber: row.notice_number,
    sourceDocumentDate: row.source_document_date,
    retrievedAt: row.retrieved_at,
    confirmedAt: row.confirmed_at,
    fetchSource: row.fetch_source as MhdMileageRate['fetchSource'],
    notes: row.notes,
  };
}

function mapEffectiveRate(row: MhdMileageEffectiveRateRpcRow): MhdMileageEffectiveRate {
  return {
    companyRate: numberOrNull(row.company_rate),
    irsRate: numberOrNull(row.irs_rate),
    irsRateId: row.irs_rate_id,
    policyId: row.policy_id,
    rateMode: row.rate_mode as MhdMileageEffectiveRate['rateMode'],
  };
}

function mapTrip(row: MhdMileageTripRpcRow): MhdMileageTrip {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdMileageTrip['referenceId'],
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    tripDate: row.trip_date,
    miles: mhdToNumber(row.miles),
    reimbursableMiles: mhdToNumber(row.reimbursable_miles),
    origin: row.origin,
    destination: row.destination,
    businessPurpose: row.business_purpose,
    recordedOnBehalf: row.recorded_on_behalf,
    claimId: row.claim_id,
    claimStatus: row.claim_status as MhdMileageTrip['claimStatus'],
    voidedAt: row.voided_at,
  };
}

function mapClaimSummary(row: MhdMileageClaimRpcRow): MhdMileageClaimSummary {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdMileageClaimSummary['referenceId'],
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status as MhdMileageClaimSummary['status'],
    lineCount: mhdToNumber(row.line_count),
    totalCompanyAmount: numberOrNull(row.total_company_amount),
  };
}

function mapClaimLine(line: MhdMileageClaimLineJson): MhdMileageClaimLine {
  return {
    lineNumber: line.line_number,
    tripDate: line.trip_date,
    miles: mhdToNumber(line.miles),
    // The stamped fields stay null on an unstamped line rather than reading as
    // zero: a draft line has no rate, and a rate of 0.00 would be a lie the UI
    // could not tell apart from the truth.
    irsRate: numberOrNull(line.irs_rate),
    companyRate: numberOrNull(line.company_rate),
    companyAmount: numberOrNull(line.company_amount),
    rateReference: line.rate_reference,
    noticeNumber: line.notice_number,
  };
}

function mapClaimDetail(row: MhdMileageClaimDetailRpcRow): MhdMileageClaimDetail {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdMileageClaimDetail['referenceId'],
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status as MhdMileageClaimDetail['status'],
    totalMiles: numberOrNull(row.total_miles),
    totalCompanyAmount: numberOrNull(row.total_company_amount),
    totalIrsAmount: numberOrNull(row.total_irs_amount),
    // Server-derived and already clamped at zero. Taken as given rather than
    // recomputed here, so the number payroll reads is the number the database
    // produced.
    taxableExcess: mhdToNumber(row.taxable_excess),
    decisionNote: row.decision_note,
    exportedAt: row.exported_at,
    lines: (row.lines ?? []).map(mapClaimLine),
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdMileageService = {
  // ----- Rate registry (global; Platform Admin writes, everyone reads) -----

  async listRates(filters: MhdMileageRateFilters = {}): Promise<MhdMileageRate[]> {
    const { data, error } = await mileageRpc('mhd_mileage_list_rates', {
      p_category: filterValueOrUndefined(filters.category),
      p_status: filterValueOrUndefined(filters.status),
    });
    if (error) throw error;
    return ((data ?? []) as MhdMileageRateRpcRow[]).map(mapRate);
  },

  /**
   * The single resolution point. Filters to ACTIVE, so a PROPOSED candidate can
   * never price anything. Returns null when no confirmed rate covers the date —
   * that gap is real and must be surfaced, not defaulted around.
   */
  async resolveRateForDate(
    category: string,
    onDate: string,
  ): Promise<MhdMileageResolvedRate | null> {
    const { data, error } = await mileageRpc('mhd_mileage_resolve_rate_for_date', {
      p_category: category,
      p_on_date: onDate,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdMileageResolvedRateRpcRow[])[0];
    return row ? { rateId: row.rate_id, ratePerMile: mhdToNumber(row.rate_per_mile) } : null;
  },

  /**
   * Raises a candidate. It lands PROPOSED and prices nothing until a human
   * confirms it; the row itself is the documentation of that decision, which is
   * why the citation is mandatory at this point rather than later.
   */
  async proposeRate(input: MhdProposeRateInput): Promise<{ id: string; referenceId: string }> {
    const { data, error } = await mileageRpc('mhd_mileage_propose_rate', {
      p_category: input.category,
      p_rate_per_mile: input.ratePerMile,
      p_effective_from: input.effectiveFrom,
      p_source_url: input.sourceUrl.trim(),
      p_notice_number: input.noticeNumber.trim(),
      p_source_document_date: input.sourceDocumentDate ?? undefined,
      p_notes: trimmedOrUndefined(input.notes),
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Rate proposal returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  /**
   * Confirmation is the moment a figure becomes authoritative. The same
   * transaction closes whatever it displaces the day before it starts, so the
   * registry never holds two ACTIVE rows for one category and date.
   */
  async confirmRate(rateId: string): Promise<void> {
    const { error } = await mileageRpc('mhd_mileage_confirm_rate', {
      p_rate_id: rateId,
    });
    if (error) throw error;
  },

  // ----- Company rate policy -----

  /**
   * Both figures for a company on a date: what it pays and what the federal
   * rate is. Always returns a row — with no policy configured the company
   * tracks the IRS business rate, which is the accountable-plan safe harbour.
   */
  async getEffectiveRate(
    companyId: string,
    onDate?: string | null,
  ): Promise<MhdMileageEffectiveRate | null> {
    const { data, error } = await mileageRpc('mhd_mileage_get_effective_rate', {
      p_company_id: companyId,
      p_on_date: onDate ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdMileageEffectiveRateRpcRow[])[0];
    return row ? mapEffectiveRate(row) : null;
  },

  /**
   * Opens a new policy version and closes the open one the day before. Existing
   * claim lines keep the policy they were stamped against, so changing the rate
   * never restates a settled reimbursement.
   */
  async setCompanyPolicy(input: MhdSetCompanyRatePolicyInput): Promise<string> {
    const { data, error } = await mileageRpc('mhd_mileage_set_company_policy', {
      p_company_id: input.companyId,
      p_effective_from: input.effectiveFrom,
      p_rate_mode: input.rateMode,
      // The generated RPC signature types this arg as `number | undefined`, so a
      // tracking policy omits it and the server's SQL default (null) applies;
      // the CHECK still pairs mode and rate server-side, so an omitted rate under
      // a tracking policy is the legal shape.
      p_fixed_rate_per_mile:
        input.rateMode === 'FIXED' ? (input.fixedRatePerMile ?? undefined) : undefined,
      p_policy_note: trimmedOrUndefined(input.policyNote),
    });
    if (error) throw error;
    return data as string;
  },

  // ----- Trips -----

  async listTrips(filters: MhdMileageTripFilters): Promise<MhdMileageTrip[]> {
    if (!filters.companyId) return [];
    const { data, error } = await mileageRpc('mhd_mileage_list_trips', {
      p_company_id: filters.companyId,
      p_person_id: filters.personId ?? undefined,
      p_from: filters.from ?? undefined,
      p_to: filters.to ?? undefined,
      p_unclaimed_only: filters.unclaimedOnly ?? false,
      p_include_voided: filters.includeVoided ?? false,
    });
    if (error) throw error;
    return ((data ?? []) as MhdMileageTripRpcRow[]).map(mapTrip);
  },

  /**
   * The affirmation is passed through as the recorder set it, never defaulted
   * to true. The RPC refuses a false one outright — an affirmation the system
   * supplies on the user's behalf is not an affirmation.
   */
  async recordTrip(input: MhdRecordTripInput): Promise<{ id: string; referenceId: string }> {
    const { data, error } = await mileageRpc('mhd_mileage_record_trip', {
      p_person_id: input.personId,
      p_trip_date: input.tripDate,
      p_miles: input.miles,
      p_origin: input.origin.trim(),
      p_destination: input.destination.trim(),
      p_business_purpose: input.businessPurpose.trim(),
      p_not_ordinary_commuting: input.notOrdinaryCommuting,
      p_is_round_trip: input.isRoundTrip ?? false,
      p_odometer_start: input.odometerStart ?? undefined,
      p_odometer_end: input.odometerEnd ?? undefined,
      p_commute_deduction_miles: input.commuteDeductionMiles ?? undefined,
      p_vehicle_description: trimmedOrUndefined(input.vehicleDescription),
      p_notes: trimmedOrUndefined(input.notes),
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Trip creation returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  /**
   * Soft delete: the trip row survives with its reason. Any unstamped claim
   * line is removed with it, which returns the trip to the unclaimed pool; a
   * trip already priced on an approved claim cannot be voided at all, because
   * the money is decided.
   */
  async voidTrip(input: MhdVoidTripInput): Promise<void> {
    const { error } = await mileageRpc('mhd_mileage_void_trip', {
      p_trip_id: input.tripId,
      p_reason: input.reason.trim(),
    });
    if (error) throw error;
  },

  /**
   * Editing is refused once the trip sits on a live claim — remove it from the
   * claim first. Voiding a trip to correct a typo would destroy a
   * substantiation record to fix a clerical mistake.
   */
  async updateTrip(input: {
    tripId: string;
    tripDate?: string | null;
    miles?: number | null;
    origin?: string | null;
    destination?: string | null;
    businessPurpose?: string | null;
    commuteDeductionMiles?: number | null;
    odometerStart?: number | null;
    odometerEnd?: number | null;
    vehicleDescription?: string | null;
    notes?: string | null;
  }): Promise<void> {
    const { error } = await mileageRpc('mhd_mileage_update_trip', {
      p_trip_id: input.tripId,
      p_trip_date: input.tripDate ?? undefined,
      p_miles: input.miles ?? undefined,
      p_origin: input.origin ?? undefined,
      p_destination: input.destination ?? undefined,
      p_business_purpose: input.businessPurpose ?? undefined,
      p_commute_deduction_miles: input.commuteDeductionMiles ?? undefined,
      p_odometer_start: input.odometerStart ?? undefined,
      p_odometer_end: input.odometerEnd ?? undefined,
      p_vehicle_description: input.vehicleDescription ?? undefined,
      p_notes: input.notes ?? undefined,
    });
    if (error) throw error;
  },

  // ----- Claims -----

  async listClaims(filters: MhdMileageClaimFilters): Promise<MhdMileageClaimSummary[]> {
    if (!filters.companyId) return [];
    const { data, error } = await mileageRpc('mhd_mileage_list_claims', {
      p_company_id: filters.companyId,
      p_person_id: filters.personId ?? undefined,
      p_status: filterValueOrUndefined(filters.status),
    });
    if (error) throw error;
    return ((data ?? []) as MhdMileageClaimRpcRow[]).map(mapClaimSummary);
  },

  async getClaim(claimId: string): Promise<MhdMileageClaimDetail | null> {
    const { data, error } = await mileageRpc('mhd_mileage_get_claim', {
      p_claim_id: claimId,
    });
    if (error) throw error;
    // The generated type serialises the `lines` aggregate as `Json`; cast through
    // `unknown` to the row shape whose `lines` is the typed line array.
    const row = ((data ?? []) as unknown as MhdMileageClaimDetailRpcRow[])[0];
    return row ? mapClaimDetail(row) : null;
  },

  async createClaim(input: MhdCreateClaimInput): Promise<{ id: string; referenceId: string }> {
    const { data, error } = await mileageRpc('mhd_mileage_create_claim', {
      p_person_id: input.personId,
      p_period_start: input.periodStart,
      p_period_end: input.periodEnd,
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Claim creation returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  /**
   * Composition is only editable while the claim is DRAFT. The one-live-claim
   * guarantee is a unique index rather than a check here — two concurrent adds
   * of the same trip would both pass an application-level test, and the trip
   * would be paid twice.
   */
  async addTripToClaim(input: MhdAddTripToClaimInput): Promise<void> {
    const { error } = await mileageRpc('mhd_mileage_add_trip_to_claim', {
      p_claim_id: input.claimId,
      p_trip_id: input.tripId,
    });
    if (error) throw error;
  },

  /**
   * Hands off to the Approvals engine. Nothing is written back onto the claim
   * pointing at the approval — the engine references the claim by
   * `entity_type = 'MILEAGE_CLAIM'` / `entity_id`, and there is no column here
   * to hold the other direction.
   */
  /** The counterpart to `addTripToClaim`. Draft claims only. */
  async removeTripFromClaim(claimId: string, tripId: string): Promise<void> {
    const { error } = await mileageRpc('mhd_mileage_remove_trip_from_claim', {
      p_claim_id: claimId,
      p_trip_id: tripId,
    });
    if (error) throw error;
  },

  /**
   * Frees the claim's trips for a new claim. A claimant may abandon their own
   * DRAFT; anything further along has been seen or decided by someone else, so
   * withdrawing it is privileged. An EXPORTED claim is refused — once it has
   * gone to payroll, withdrawing it is a conversation with payroll.
   */
  async cancelClaim(claimId: string, reason: string): Promise<void> {
    const { error } = await mileageRpc('mhd_mileage_cancel_claim', {
      p_claim_id: claimId,
      p_reason: reason.trim(),
    });
    if (error) throw error;
  },

  async submitClaim(claimId: string): Promise<void> {
    const { error } = await mileageRpc('mhd_mileage_submit_claim', {
      p_claim_id: claimId,
    });
    if (error) throw error;
  },

  /**
   * Approval is where rates are stamped, once and permanently. Every line is
   * priced against the rate in force ON ITS OWN TRIP DATE, so a claim spanning
   * a mid-year revision settles each half correctly — which is also why any
   * pre-approval total shown in the UI is indicative and must be labelled so.
   *
   * Approval fails outright when no confirmed rate covers a line's date. That
   * is deliberate: pricing a claim at a guessed figure is the failure this
   * module exists to prevent.
   */
  async decideClaim(input: MhdDecideClaimInput): Promise<void> {
    const { error } = await mileageRpc('mhd_mileage_decide_claim', {
      p_claim_id: input.claimId,
      p_decision: input.decision,
      p_decision_note: trimmedOrUndefined(input.decisionNote),
    });
    if (error) throw error;
  },

  /** Terminal. Only an APPROVED claim can be exported, and only once. */
  async markExported(input: MhdMarkClaimExportedInput): Promise<void> {
    const { error } = await mileageRpc('mhd_mileage_mark_exported', {
      p_claim_id: input.claimId,
      p_batch_reference: input.batchReference.trim(),
    });
    if (error) throw error;
  },

  // ----- Visibility -----

  /**
   * Whether the caller may see the whole company rather than only their own
   * trips and claims. The RPCs enforce this regardless; this exists so the UI
   * can hide the registry and policy editors instead of rendering them into a
   * permission error.
   */
  async isPrivileged(): Promise<boolean> {
    const { data, error } = await mileageRpc('mhd_mileage_is_privileged', undefined);
    if (error) throw error;
    return Boolean(data);
  },
};
