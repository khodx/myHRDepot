import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdBenefitCaseLink,
  MhdBenefitCaseType,
  MhdBenefitIntakeAnswers,
  MhdBenefitIntakePayload,
  MhdBenefitIntakeResult,
  MhdInformationRequest,
  MhdInformationRequestInput,
  MhdInformationResponseInput,
} from './Types';
export const mhdBenefitIntakeService = {
  async route(answers: MhdBenefitIntakeAnswers) {
    const { data, error } = await supabaseClient.rpc('mhd_benefit_intake_route', {
      p_answers: {
        reason: answers.reason,
        needs_time_away: answers.needsTimeAway,
        needs_workplace_change: answers.needsWorkplaceChange,
      },
    });
    if (error) throw new Error(error.message);
    return data as unknown as MhdBenefitIntakeResult['outcome'];
  },
  async submit(payload: MhdBenefitIntakePayload): Promise<MhdBenefitIntakeResult> {
    const accommodation = payload.accommodation
      ? {
          request_summary: payload.accommodation.requestSummary,
          request_source: payload.accommodation.requestSource,
          request_channel: payload.accommodation.requestChannel,
          details: payload.accommodation.details,
        }
      : undefined;
    const body = {
      subject_person_id: payload.subjectPersonId,
      reason: payload.reason,
      needs_time_away: payload.needsTimeAway,
      needs_workplace_change: payload.needsWorkplaceChange,
      family_relationship: payload.familyRelationship,
      requested_start: payload.requestedStart,
      requested_end: payload.requestedEnd,
      requested_mode: payload.requestedMode,
      bonding_event_type: payload.bondingEventType,
      bonding_event_date: payload.bondingEventDate,
      leave_reason_category: payload.leaveReasonCategory,
      file_category: payload.fileCategory,
      intake_channel: payload.intakeChannel,
      accommodation,
    };
    // JSON.stringify drops undefined keys, so the server only sees the fields the user supplied.
    const { data, error } = await supabaseClient.rpc('mhd_benefit_intake_submit', {
      p_payload: JSON.parse(JSON.stringify(body)),
    });
    if (error) throw new Error(error.message);
    const r = data as unknown as {
      outcome: MhdBenefitIntakeResult['outcome'];
      leave_case_id?: string;
      leave_review_task_id?: string;
      accommodation_case_id?: string;
      accommodation_review_task_id?: string;
      eligibility?: { ran: boolean; snapshot_id?: string; blockers?: string[]; message?: string };
    };
    return {
      outcome: r.outcome,
      leaveCaseId: r.leave_case_id,
      leaveReviewTaskId: r.leave_review_task_id,
      accommodationCaseId: r.accommodation_case_id,
      accommodationReviewTaskId: r.accommodation_review_task_id,
      eligibility: r.eligibility
        ? {
            ran: r.eligibility.ran,
            snapshotId: r.eligibility.snapshot_id,
            blockers: r.eligibility.blockers ?? [],
            message: r.eligibility.message,
          }
        : undefined,
    };
  },
  async createInformationRequest(input: MhdInformationRequestInput) {
    const { data, error } = await supabaseClient.rpc('mhd_information_request_create', {
      p_case_type: input.caseType,
      p_case_id: input.caseId,
      p_question: input.question,
      p_due_date: input.dueDate,
    });
    if (error) throw new Error(error.message);
    return data;
  },
  async respondToInformationRequest(input: MhdInformationResponseInput) {
    const { error } = await supabaseClient.rpc('mhd_information_request_respond', {
      p_activity_id: input.activityId,
      p_response: input.response,
    });
    if (error) throw new Error(error.message);
  },
  async listCaseLinks(caseType: MhdBenefitCaseType, caseId: string) {
    const { data, error } = await supabaseClient
      .from('benefit_case_links')
      .select(
        'id, company_id, case_type, case_id, link_kind, activity_id, task_id, subject_visible, created_at',
      )
      .eq('case_type', caseType)
      .eq('case_id', caseId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      id: r.id,
      companyId: r.company_id,
      caseType: r.case_type as MhdBenefitCaseType,
      caseId: r.case_id,
      linkKind: r.link_kind,
      activityId: r.activity_id,
      taskId: r.task_id,
      subjectVisible: r.subject_visible,
      createdAt: r.created_at,
    })) as MhdBenefitCaseLink[];
  },
  async listInformationRequests(caseType: MhdBenefitCaseType, caseId: string) {
    const links = await this.listCaseLinks(caseType, caseId);
    const result: MhdInformationRequest[] = [];
    for (const link of links.filter(
      (item) => item.linkKind === 'INFORMATION_REQUEST' && item.activityId,
    )) {
      const { data, error } = await supabaseClient
        .from('activities')
        .select('id, title, description_plain_text, status, scheduled_at, created_at')
        .eq('id', link.activityId!)
        .single();
      if (error) throw new Error(error.message);
      result.push({
        activityId: data.id,
        title: data.title,
        question: data.description_plain_text ?? '',
        status: data.status,
        dueAt: data.scheduled_at ?? '',
        createdAt: data.created_at ?? '',
        followUpTaskId: link.taskId,
      });
    }
    return result;
  },
};
