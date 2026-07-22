import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAdjustPointsInput,
  MhdAssignScheduleTemplateInput,
  MhdAttendanceOccurrence,
  MhdAttendanceOccurrenceFilters,
  MhdAttendanceOccurrenceRpcRow,
  MhdAttendancePolicy,
  MhdAttendancePolicyRpcRow,
  MhdCompanyHoliday,
  MhdCompanyHolidayRpcRow,
  MhdCreatePolicyVersionInput,
  MhdCreateScheduleTemplateInput,
  MhdGenerateShiftsInput,
  MhdOverrideShiftInput,
  MhdPointLedgerEntry,
  MhdPointLedgerEntryRpcRow,
  MhdReassessmentEvent,
  MhdReassessmentEventRpcRow,
  MhdReclassifyOccurrenceInput,
  MhdRecordOccurrenceRpcRow,
  MhdResolveReassessmentInput,
  MhdResolveThresholdEventInput,
  MhdScheduleAssignment,
  MhdScheduleAssignmentRpcRow,
  MhdScheduleTemplateDayRpcRow,
  MhdScheduleTemplateDetail,
  MhdScheduleTemplateRpcRow,
  MhdScheduleTemplateSummary,
  MhdScheduledShift,
  MhdScheduledShiftRpcRow,
  MhdThresholdEvent,
  MhdThresholdEventRpcRow,
  MhdUpdateOccurrenceInput,
  MhdUpdateScheduleTemplateInput,
  MhdVoidOccurrenceInput,
} from './Types';
import { mhdToNumber } from './Types';

const attendanceRpc = supabaseClient.rpc.bind(supabaseClient);

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

function mapTemplateSummary(row: MhdScheduleTemplateRpcRow): MhdScheduleTemplateSummary {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdScheduleTemplateSummary['referenceId'],
    templateName: row.template_name,
    description: row.description,
    isActive: row.is_active,
    totalWeeklyHours: mhdToNumber(row.total_weekly_hours),
    workingDays: mhdToNumber(row.working_days),
    assignedCount: mhdToNumber(row.assigned_count),
    createdAt: row.created_at,
  };
}

/**
 * `mhd_schedule_get_template` returns one row per day of week, with the template
 * columns repeated. Collapse to a single detail object; the RPC orders by
 * day_of_week, so the array is already Sunday-first.
 */
function mapTemplateDetail(rows: MhdScheduleTemplateDayRpcRow[]): MhdScheduleTemplateDetail | null {
  const first = rows[0];
  if (!first) return null;
  return {
    id: first.id,
    referenceId: first.reference_id as MhdScheduleTemplateDetail['referenceId'],
    companyId: first.company_id,
    templateName: first.template_name,
    description: first.description,
    isActive: first.is_active,
    days: rows.map((row) => ({
      dayOfWeek: row.day_of_week,
      isWorkingDay: row.is_working_day,
      startTime: row.start_time,
      endTime: row.end_time,
      unpaidBreakMinutes: mhdToNumber(row.unpaid_break_minutes),
    })),
  };
}

function mapAssignment(row: MhdScheduleAssignmentRpcRow): MhdScheduleAssignment {
  return {
    id: row.id,
    templateId: row.template_id,
    templateName: row.template_name,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    assignmentNote: row.assignment_note,
  };
}

function mapShift(row: MhdScheduledShiftRpcRow): MhdScheduledShift {
  return {
    id: row.id,
    shiftDate: row.shift_date,
    startTime: row.start_time,
    endTime: row.end_time,
    unpaidBreakMinutes: mhdToNumber(row.unpaid_break_minutes),
    source: row.source as MhdScheduledShift['source'],
    isHoliday: row.is_holiday,
    overrideReason: row.override_reason,
    occurrenceId: row.occurrence_id,
    occurrenceType: row.occurrence_type as MhdScheduledShift['occurrenceType'],
    classification: row.classification as MhdScheduledShift['classification'],
  };
}

function mapHoliday(row: MhdCompanyHolidayRpcRow): MhdCompanyHoliday {
  return {
    id: row.id,
    holidayDate: row.holiday_date,
    holidayName: row.holiday_name,
    isPaid: row.is_paid,
  };
}

function mapPolicy(row: MhdAttendancePolicyRpcRow): MhdAttendancePolicy {
  return {
    id: row.id,
    policyName: row.policy_name,
    effectiveFrom: row.effective_from,
    rollOffMonths: mhdToNumber(row.roll_off_months),
    excusedUnpaidAccrues: row.excused_unpaid_accrues,
    excusedPaidAccrues: row.excused_paid_accrues,
    pointRules: (row.point_rules ?? []).map((rule) => ({
      occurrenceType: rule.occurrence_type as MhdAttendancePolicy['pointRules'][number]['occurrenceType'],
      points: mhdToNumber(rule.points),
    })),
    thresholds: (row.thresholds ?? [])
      .map((threshold) => ({
        id: threshold.id,
        pointsAt: mhdToNumber(threshold.points_at),
        actionLevel: threshold.action_level as MhdAttendancePolicy['thresholds'][number]['actionLevel'],
      }))
      .sort((a, b) => a.pointsAt - b.pointsAt),
  };
}

function mapOccurrence(row: MhdAttendanceOccurrenceRpcRow): MhdAttendanceOccurrence {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdAttendanceOccurrence['referenceId'],
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    occurrenceDate: row.occurrence_date,
    occurrenceType: row.occurrence_type as MhdAttendanceOccurrence['occurrenceType'],
    classification: row.classification as MhdAttendanceOccurrence['classification'],
    protectedLeaveCategory:
      row.protected_leave_category as MhdAttendanceOccurrence['protectedLeaveCategory'],
    minutesVariance: row.minutes_variance == null ? null : mhdToNumber(row.minutes_variance),
    reasonNote: row.reason_note,
    pointsAssessed: mhdToNumber(row.points_assessed),
    voidedAt: row.voided_at,
  };
}

function mapLedgerEntry(row: MhdPointLedgerEntryRpcRow): MhdPointLedgerEntry {
  return {
    id: row.id,
    occurrenceId: row.occurrence_id,
    occurrenceReference: row.occurrence_reference,
    entryType: row.entry_type as MhdPointLedgerEntry['entryType'],
    pointsDelta: mhdToNumber(row.points_delta),
    effectiveDate: row.effective_date,
    expiresOn: row.expires_on,
    reason: row.reason,
    reversalOfEntryId: row.reversal_of_entry_id,
    createdAt: row.created_at,
  };
}

function mapReassessmentEvent(row: MhdReassessmentEventRpcRow): MhdReassessmentEvent {
  return {
    id: row.id,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    occurrenceId: row.occurrence_id,
    occurrenceReference: row.occurrence_reference,
    occurrenceDate: row.occurrence_date,
    occurrenceType: row.occurrence_type as MhdReassessmentEvent['occurrenceType'],
    fromClassification: row.from_classification as MhdReassessmentEvent['fromClassification'],
    toClassification: row.to_classification as MhdReassessmentEvent['toClassification'],
    raisedAt: row.raised_at,
    status: row.status as MhdReassessmentEvent['status'],
    decisionNote: row.decision_note,
    pointsAssessed: row.points_assessed == null ? null : mhdToNumber(row.points_assessed),
    resolvedAt: row.resolved_at,
    projectedPoints: mhdToNumber(row.projected_points),
  };
}

function mapThresholdEvent(row: MhdThresholdEventRpcRow): MhdThresholdEvent {
  return {
    id: row.id,
    personId: row.person_id,
    personDisplayName: row.person_display_name,
    actionLevel: row.action_level as MhdThresholdEvent['actionLevel'],
    pointsAt: mhdToNumber(row.points_at),
    pointsAtCrossing: mhdToNumber(row.points_at_crossing),
    crossedAt: row.crossed_at,
    status: row.status as MhdThresholdEvent['status'],
    resolutionNote: row.resolution_note,
    linkedTaskId: row.linked_task_id,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdTimeAttendanceService = {
  // ----- Schedule -----

  async listTemplates(companyId: string): Promise<MhdScheduleTemplateSummary[]> {
    const { data, error } = await attendanceRpc('mhd_schedule_list_templates', {
      p_company_id: companyId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdScheduleTemplateRpcRow[]).map(mapTemplateSummary);
  },

  async getTemplate(templateId: string): Promise<MhdScheduleTemplateDetail | null> {
    const { data, error } = await attendanceRpc('mhd_schedule_get_template', {
      p_template_id: templateId,
    });
    if (error) throw error;
    return mapTemplateDetail((data ?? []) as MhdScheduleTemplateDayRpcRow[]);
  },

  async createTemplate(input: MhdCreateScheduleTemplateInput): Promise<{ id: string; referenceId: string }> {
    const { data, error } = await attendanceRpc('mhd_schedule_create_template', {
      p_company_id: input.companyId,
      p_template_name: input.templateName.trim(),
      // The RPC materialises all seven days server-side; days omitted from this
      // array default to non-working.
      p_days: input.days.map((day) => ({
        day_of_week: day.dayOfWeek,
        is_working_day: day.isWorkingDay,
        start_time: day.isWorkingDay ? day.startTime : null,
        end_time: day.isWorkingDay ? day.endTime : null,
        unpaid_break_minutes: day.unpaidBreakMinutes ?? 0,
      })),
      p_description: trimmedOrUndefined(input.description),
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Schedule template creation returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  async updateTemplate(input: MhdUpdateScheduleTemplateInput): Promise<void> {
    const { error } = await attendanceRpc('mhd_schedule_update_template', {
      p_template_id: input.templateId,
      p_template_name: trimmedOrUndefined(input.templateName),
      p_description: input.description ?? undefined,
      p_is_active: input.isActive ?? undefined,
      p_days: input.days
        ? input.days.map((day) => ({
            day_of_week: day.dayOfWeek,
            is_working_day: day.isWorkingDay,
            start_time: day.isWorkingDay ? day.startTime : null,
            end_time: day.isWorkingDay ? day.endTime : null,
            unpaid_break_minutes: day.unpaidBreakMinutes ?? 0,
          }))
        : undefined,
    });
    if (error) throw error;
  },

  async deleteTemplate(templateId: string): Promise<void> {
    const { error } = await attendanceRpc('mhd_schedule_delete_template', {
      p_template_id: templateId,
    });
    if (error) throw error;
  },

  async assignTemplate(input: MhdAssignScheduleTemplateInput): Promise<string> {
    const { data, error } = await attendanceRpc('mhd_schedule_assign_template', {
      p_person_id: input.personId,
      p_template_id: input.templateId,
      p_effective_from: input.effectiveFrom,
      p_note: trimmedOrUndefined(input.note),
    });
    if (error) throw error;
    return data as string;
  },

  async endAssignment(assignmentId: string, effectiveTo: string): Promise<void> {
    const { error } = await attendanceRpc('mhd_schedule_end_assignment', {
      p_assignment_id: assignmentId,
      p_effective_to: effectiveTo,
    });
    if (error) throw error;
  },

  async listAssignments(personId: string): Promise<MhdScheduleAssignment[]> {
    const { data, error } = await attendanceRpc('mhd_schedule_list_assignments', {
      p_person_id: personId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdScheduleAssignmentRpcRow[]).map(mapAssignment);
  },

  /** Returns the number of shift rows written. Non-destructive to MANUAL/OVERRIDE rows. */
  async generateShifts(input: MhdGenerateShiftsInput): Promise<number> {
    const { data, error } = await attendanceRpc('mhd_schedule_generate_shifts', {
      p_person_id: input.personId,
      p_from: input.from,
      p_to: input.to,
    });
    if (error) throw error;
    return mhdToNumber(data as number | string);
  },

  async listShifts(personId: string, from: string, to: string): Promise<MhdScheduledShift[]> {
    const { data, error } = await attendanceRpc('mhd_schedule_list_shifts', {
      p_person_id: personId,
      p_from: from,
      p_to: to,
    });
    if (error) throw error;
    return ((data ?? []) as MhdScheduledShiftRpcRow[]).map(mapShift);
  },

  async overrideShift(input: MhdOverrideShiftInput): Promise<void> {
    const { error } = await attendanceRpc('mhd_schedule_override_shift', {
      p_shift_id: input.shiftId,
      p_start_time: input.startTime,
      p_end_time: input.endTime,
      // Live 0032 types make this a required numeric arg (no default); the
      // package sent `undefined`. Zero is the correct "no break" value.
      p_unpaid_break_minutes: input.unpaidBreakMinutes ?? 0,
      p_reason: input.reason.trim(),
    });
    if (error) throw error;
  },

  async listHolidays(companyId: string, from?: string | null, to?: string | null): Promise<MhdCompanyHoliday[]> {
    const { data, error } = await attendanceRpc('mhd_schedule_list_holidays', {
      p_company_id: companyId,
      p_from: from ?? undefined,
      p_to: to ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdCompanyHolidayRpcRow[]).map(mapHoliday);
  },

  async upsertHoliday(
    companyId: string,
    holidayDate: string,
    holidayName: string,
    isPaid = true,
  ): Promise<string> {
    const { data, error } = await attendanceRpc('mhd_schedule_upsert_holiday', {
      p_company_id: companyId,
      p_holiday_date: holidayDate,
      p_holiday_name: holidayName.trim(),
      p_is_paid: isPaid,
    });
    if (error) throw error;
    return data as string;
  },

  async deleteHoliday(holidayId: string): Promise<void> {
    const { error } = await attendanceRpc('mhd_schedule_delete_holiday', {
      p_holiday_id: holidayId,
    });
    if (error) throw error;
  },

  // ----- Policy -----

  /** Returns the currently open policy version, or null when none is configured yet. */
  async getPolicy(companyId: string): Promise<MhdAttendancePolicy | null> {
    const { data, error } = await attendanceRpc('mhd_attendance_get_policy', {
      p_company_id: companyId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdAttendancePolicyRpcRow[])[0];
    return row ? mapPolicy(row) : null;
  },

  /**
   * Closes the open version and opens a new one. Historical ledger rows keep
   * pointing at the version that produced them, so an old assessment stays
   * explicable under the policy in force at the time (Business Rule 10).
   */
  async createPolicyVersion(input: MhdCreatePolicyVersionInput): Promise<string> {
    const { data, error } = await attendanceRpc('mhd_attendance_create_policy_version', {
      p_company_id: input.companyId,
      p_policy_name: input.policyName.trim(),
      p_effective_from: input.effectiveFrom,
      p_roll_off_months: input.rollOffMonths,
      p_excused_unpaid_accrues: input.excusedUnpaidAccrues,
      p_excused_paid_accrues: input.excusedPaidAccrues,
      p_point_rules: input.pointRules.map((rule) => ({
        occurrence_type: rule.occurrenceType,
        points: rule.points,
      })),
      p_thresholds: input.thresholds.map((threshold) => ({
        points_at: threshold.pointsAt,
        action_level: threshold.actionLevel,
      })),
    });
    if (error) throw error;
    return data as string;
  },

  // ----- Occurrences -----

  async listOccurrences(filters: MhdAttendanceOccurrenceFilters): Promise<MhdAttendanceOccurrence[]> {
    if (!filters.companyId) return [];
    const { data, error } = await attendanceRpc('mhd_attendance_list_occurrences', {
      p_company_id: filters.companyId,
      p_person_id: filters.personId ?? undefined,
      p_from: filters.from ?? undefined,
      p_to: filters.to ?? undefined,
      p_occurrence_type: filterValueOrUndefined(filters.occurrenceType),
      p_classification: filterValueOrUndefined(filters.classification),
      p_include_voided: filters.includeVoided ?? false,
    });
    if (error) throw error;
    return ((data ?? []) as MhdAttendanceOccurrenceRpcRow[]).map(mapOccurrence);
  },

  /** Returns the points actually assessed — 0 whenever the classification does not accrue. */
  async recordOccurrence(input: {
    personId: string;
    occurrenceDate: string;
    occurrenceType: string;
    classification: string;
    protectedLeaveCategory?: string | null;
    minutesVariance?: number | null;
    reasonNote?: string | null;
    scheduledShiftId?: string | null;
  }): Promise<{ id: string; referenceId: string; pointsAssessed: number }> {
    const { data, error } = await attendanceRpc('mhd_attendance_record_occurrence', {
      p_person_id: input.personId,
      p_occurrence_date: input.occurrenceDate,
      p_occurrence_type: input.occurrenceType,
      p_classification: input.classification,
      // Live 0032 types this arg as optional `string` (not nullable); omitting
      // it makes the RPC apply its NULL default, which is what the paired
      // classification/category CHECK expects for a non-protected occurrence.
      // A PROTECTED occurrence always carries a category, so it is never omitted
      // in the case that matters.
      p_protected_leave_category: input.protectedLeaveCategory ?? undefined,
      p_minutes_variance: input.minutesVariance ?? undefined,
      p_reason_note: trimmedOrUndefined(input.reasonNote),
      p_scheduled_shift_id: input.scheduledShiftId ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdRecordOccurrenceRpcRow[])[0];
    if (!row) throw new Error('Occurrence creation returned no row.');
    return {
      id: row.id,
      referenceId: row.reference_id,
      pointsAssessed: mhdToNumber(row.points_assessed),
    };
  },

  async updateOccurrence(input: MhdUpdateOccurrenceInput): Promise<void> {
    const { error } = await attendanceRpc('mhd_attendance_update_occurrence', {
      p_occurrence_id: input.occurrenceId,
      p_occurrence_type: input.occurrenceType ?? undefined,
      p_minutes_variance: input.minutesVariance ?? undefined,
      p_reason_note: input.reasonNote ?? undefined,
    });
    if (error) throw error;
  },

  /**
   * The legally significant operation. Reclassifying into a non-accruing state
   * fires the server-side reversal trigger; the original assessment row is never
   * touched, so the ledger shows what was assessed and that it was unwound.
   *
   * Asymmetry worth knowing: the trigger only ever reverses. Reclassifying OUT
   * of a non-accruing state (PROTECTED -> UNEXCUSED) leaves the occurrence at
   * zero points until an administrator adjusts them by hand. Fail-safe and
   * deliberate — surface the zero in the UI so it is not recorded silently.
   */
  async reclassifyOccurrence(input: MhdReclassifyOccurrenceInput): Promise<void> {
    const { error } = await attendanceRpc('mhd_attendance_reclassify_occurrence', {
      p_occurrence_id: input.occurrenceId,
      p_classification: input.classification,
      // Optional `string` in the live 0032 types; omit for a non-protected
      // target so the RPC applies its NULL default (see recordOccurrence).
      p_protected_leave_category: input.protectedLeaveCategory ?? undefined,
      p_reason: trimmedOrUndefined(input.reason),
    });
    if (error) throw error;
  },

  /** Soft delete: unwinds points via reversals, but the occurrence row survives. */
  async voidOccurrence(input: MhdVoidOccurrenceInput): Promise<void> {
    const { error } = await attendanceRpc('mhd_attendance_void_occurrence', {
      p_occurrence_id: input.occurrenceId,
      p_reason: input.reason.trim(),
    });
    if (error) throw error;
  },

  // ----- Points -----

  async pointBalance(personId: string, asOf?: string | null): Promise<number> {
    const { data, error } = await attendanceRpc('mhd_attendance_point_balance', {
      p_person_id: personId,
      p_as_of: asOf ?? undefined,
    });
    if (error) throw error;
    return mhdToNumber(data as number | string);
  },

  async listPointLedger(
    personId: string,
    from?: string | null,
    to?: string | null,
  ): Promise<MhdPointLedgerEntry[]> {
    const { data, error } = await attendanceRpc('mhd_attendance_list_point_ledger', {
      p_person_id: personId,
      p_from: from ?? undefined,
      p_to: to ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdPointLedgerEntryRpcRow[]).map(mapLedgerEntry);
  },

  async adjustPoints(input: MhdAdjustPointsInput): Promise<string> {
    const { data, error } = await attendanceRpc('mhd_attendance_adjust_points', {
      p_person_id: input.personId,
      p_points_delta: input.pointsDelta,
      p_reason: input.reason.trim(),
      p_effective_date: input.effectiveDate ?? undefined,
      p_occurrence_id: input.occurrenceId ?? undefined,
    });
    if (error) throw error;
    return data as string;
  },

  // ----- Threshold events (privileged only — no employee-facing read) -----

  async listThresholdEvents(companyId: string, status?: string | null): Promise<MhdThresholdEvent[]> {
    const { data, error } = await attendanceRpc('mhd_attendance_list_threshold_events', {
      p_company_id: companyId,
      p_status: filterValueOrUndefined(status),
    });
    if (error) throw error;
    return ((data ?? []) as MhdThresholdEventRpcRow[]).map(mapThresholdEvent);
  },

  async resolveThresholdEvent(input: MhdResolveThresholdEventInput): Promise<void> {
    const { error } = await attendanceRpc('mhd_attendance_resolve_threshold_event', {
      p_event_id: input.eventId,
      p_status: input.status,
      p_resolution_note: trimmedOrUndefined(input.resolutionNote),
      p_linked_task_id: input.linkedTaskId ?? undefined,
    });
    if (error) throw error;
  },

  // ----- Reassessment queue (privileged only — the consistency record) -----

  async listReassessmentEvents(
    companyId: string,
    status?: string | null,
  ): Promise<MhdReassessmentEvent[]> {
    const { data, error } = await attendanceRpc('mhd_attendance_list_reassessment_events', {
      p_company_id: companyId,
      p_status: filterValueOrUndefined(status),
    });
    if (error) throw error;
    return ((data ?? []) as MhdReassessmentEventRpcRow[]).map(mapReassessmentEvent);
  },

  /**
   * Resolve an item either way. Returns the new ledger entry id on ASSESSED,
   * null on DECLINED.
   *
   * Omitting `points` / `effectiveDate` is the intended path: the server then
   * uses the occurrence-date policy's rule and backdates to the occurrence
   * itself, which is what keeps the roll-off clock identical to every other
   * occurrence. Override only with a reason that says why.
   */
  async resolveReassessmentEvent(input: MhdResolveReassessmentInput): Promise<string | null> {
    const { data, error } = await attendanceRpc('mhd_attendance_resolve_reassessment_event', {
      p_event_id: input.eventId,
      p_decision: input.decision,
      p_decision_note: input.decisionNote.trim(),
      p_points: input.points ?? undefined,
      p_effective_date: input.effectiveDate ?? undefined,
    });
    if (error) throw error;
    return (data as string | null) ?? null;
  },
};
