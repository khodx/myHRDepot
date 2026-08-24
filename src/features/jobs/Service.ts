import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAssignJobInput,
  MhdCareerOneStopOccupationLookupInput,
  MhdCareerOneStopOccupationLookupResponse,
  MhdCompetency,
  MhdCompetencyRpcRow,
  MhdCreateJobInput,
  MhdJob,
  MhdJobAssignment,
  MhdJobAssignmentRpcRow,
  MhdJobRpcRow,
  MhdOnetOccupationLookupInput,
  MhdOnetOccupationLookupResponse,
  MhdOnetOccupationSearchInput,
  MhdOnetOccupationSearchResponse,
  MhdPublishedJobDescription,
  MhdPublishedJobRpcRow,
  MhdSetPayRangeInput,
  MhdUpdateDescriptionDraftInput,
  MhdUpdateJobInput,
  MhdUpsertCompetencyInput,
} from './Types';
import { mhdToNullableNumber, mhdToNumber } from './Types';

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

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapJob(row: MhdJobRpcRow): MhdJob {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdJob['referenceId'],
    jobTitle: row.job_title,
    jobCode: row.job_code,
    jobFamily: row.job_family,
    jobLevel: row.job_level,
    department: row.department,
    flsaClassification: row.flsa_classification as MhdJob['flsaClassification'],
    flsaClassificationSource: row.flsa_classification_source as MhdJob['flsaClassificationSource'],
    employmentType: row.employment_type as MhdJob['employmentType'],
    isSafetySensitive: row.is_safety_sensitive,
    industry: row.industry as MhdJob['industry'],
    onetSocCode: row.onet_soc_code,
    caWageOrderClassification:
      row.ca_wage_order_classification as MhdJob['caWageOrderClassification'],
    // Nullable, not zero-defaulted: null means "masked or unset", and collapsing
    // it to 0 would render a pay range of zero, which is a lie in both cases.
    payMin: mhdToNullableNumber(row.pay_min),
    payMax: mhdToNullableNumber(row.pay_max),
    payPeriod: row.pay_period as MhdJob['payPeriod'],
    isActive: row.is_active,
    incumbentCount: mhdToNumber(row.incumbent_count),
    publishedDescriptionId: row.published_description_id,
  };
}

function mapAssignment(row: MhdJobAssignmentRpcRow): MhdJobAssignment {
  return {
    id: row.id,
    jobId: row.job_id,
    jobTitle: row.job_title,
    jobReference: row.job_reference,
    flsaClassification: row.flsa_classification as MhdJobAssignment['flsaClassification'],
    isSafetySensitive: row.is_safety_sensitive,
    effectiveFrom: row.effective_from,
    effectiveTo: row.effective_to,
    managerPersonId: row.manager_person_id,
    assignmentNote: row.assignment_note,
  };
}

function mapCompetency(row: MhdCompetencyRpcRow): MhdCompetency {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdCompetency['referenceId'],
    companyId: row.company_id,
    competencyName: row.competency_name,
    description: row.description,
    category: row.category,
    industry: row.industry as MhdCompetency['industry'],
    isRegulated: row.is_regulated,
    isActive: row.is_active,
    isGlobal: row.is_global,
  };
}

function mapPublishedDescription(row: MhdPublishedJobRpcRow): MhdPublishedJobDescription {
  return {
    jobId: row.job_id,
    jobTitle: row.job_title,
    flsaClassification: row.flsa_classification as MhdPublishedJobDescription['flsaClassification'],
    isSafetySensitive: row.is_safety_sensitive,
    industry: row.industry as MhdPublishedJobDescription['industry'],
    descriptionId: row.description_id,
    descriptionReference: row.description_reference,
    versionNumber: mhdToNumber(row.version_number),
    effectiveFrom: row.effective_from,
    summary: row.summary,
    essentialFunctions: (row.essential_functions ?? []).map((f) => ({ text: f.text })),
    marginalFunctions: (row.marginal_functions ?? []).map((f) => ({ text: f.text })),
    qualifications: (row.qualifications ?? []).map((q) => ({
      text: q.text,
      type: q.type as MhdPublishedJobDescription['qualifications'][number]['type'],
      required: q.required,
    })),
    competencies: (row.competencies ?? []).map((c) => ({
      competencyId: c.competency_id,
      name: c.name,
      category: c.category,
      isRegulated: c.is_regulated,
      weight: mhdToNullableNumber(c.weight),
    })),
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const mhdJobsService = {
  // ----- Jobs -----

  async listJobs(companyId: string, search?: string | null, activeOnly = true): Promise<MhdJob[]> {
    const { data, error } = await supabaseClient.rpc('mhd_job_list_jobs', {
      p_company_id: companyId,
      p_search: trimmedOrUndefined(search),
      p_active_only: activeOnly,
    });
    if (error) throw error;
    return ((data ?? []) as MhdJobRpcRow[]).map(mapJob);
  },

  async createJob(input: MhdCreateJobInput): Promise<{ id: string; referenceId: string }> {
    const { data, error } = await supabaseClient.rpc('mhd_job_create_job', {
      p_company_id: input.companyId,
      p_job_title: input.jobTitle.trim(),
      p_job_code: trimmedOrUndefined(input.jobCode),
      p_job_family: trimmedOrUndefined(input.jobFamily),
      p_job_level: trimmedOrUndefined(input.jobLevel),
      p_department: trimmedOrUndefined(input.department),
      p_flsa_classification: input.flsaClassification ?? undefined,
      p_employment_type: input.employmentType ?? 'FULL_TIME',
      p_is_safety_sensitive: input.isSafetySensitive ?? false,
      p_industry: input.industry ?? 'GENERAL',
      p_onet_soc_code: trimmedOrUndefined(input.onetSocCode),
      p_ca_wage_order_classification: input.caWageOrderClassification ?? undefined,
      p_pay_min: input.payMin ?? undefined,
      p_pay_max: input.payMax ?? undefined,
      p_pay_period: input.payPeriod ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Job creation returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  async updateJob(input: MhdUpdateJobInput): Promise<void> {
    const onetSocCodeArgs =
      input.onetSocCode === null
        ? { p_clear_onet_soc_code: true }
        : input.onetSocCode === undefined
          ? {}
          : { p_onet_soc_code: trimmedOrUndefined(input.onetSocCode) };
    const caWageOrderClassificationArgs =
      input.caWageOrderClassification === null
        ? { p_clear_ca_wage_order_classification: true }
        : input.caWageOrderClassification === undefined
          ? {}
          : { p_ca_wage_order_classification: input.caWageOrderClassification };
    const { error } = await supabaseClient.rpc('mhd_job_update_job', {
      p_job_id: input.jobId,
      p_job_title: trimmedOrUndefined(input.jobTitle),
      p_job_code: input.jobCode ?? undefined,
      p_job_family: input.jobFamily ?? undefined,
      p_job_level: input.jobLevel ?? undefined,
      p_department: input.department ?? undefined,
      p_flsa_classification: input.flsaClassification ?? undefined,
      p_employment_type: input.employmentType ?? undefined,
      p_is_safety_sensitive: input.isSafetySensitive ?? undefined,
      p_industry: input.industry ?? undefined,
      p_is_active: input.isActive ?? undefined,
      ...onetSocCodeArgs,
      ...caWageOrderClassificationArgs,
    });
    if (error) throw error;
  },

  /**
   * Separate call, separate authorisation. The RPC refuses anyone who is not
   * Platform Admin or HR Partner, so nobody can overwrite a band they cannot
   * read.
   */
  async setPayRange(input: MhdSetPayRangeInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_job_set_pay_range', {
      p_job_id: input.jobId,
      p_pay_min: input.payMin,
      p_pay_max: input.payMax,
      p_pay_period: input.payPeriod,
    });
    if (error) throw error;
  },

  async deleteJob(jobId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_job_delete_job', { p_job_id: jobId });
    if (error) throw error;
  },

  // ----- Descriptions -----

  /** `copyFrom` brings the source version's functions, qualifications and competencies with it. */
  async createDraft(
    jobId: string,
    copyFrom?: string | null,
  ): Promise<{ id: string; referenceId: string }> {
    const { data, error } = await supabaseClient.rpc('mhd_job_description_create_draft', {
      p_job_id: jobId,
      p_copy_from: copyFrom ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string; reference_id: string }>)[0];
    if (!row) throw new Error('Draft creation returned no row.');
    return { id: row.id, referenceId: row.reference_id };
  },

  async updateDraft(input: MhdUpdateDescriptionDraftInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_job_description_update_draft', {
      p_description_id: input.descriptionId,
      p_summary: input.summary ?? undefined,
      p_scope_of_role: input.scopeOfRole ?? undefined,
      p_supervisory_responsibility: input.supervisoryResponsibility ?? undefined,
      p_travel_requirement: input.travelRequirement ?? undefined,
      p_work_environment: input.workEnvironment ?? undefined,
      p_physical_requirements: input.physicalRequirements ?? undefined,
      p_education_requirements: input.educationRequirements ?? undefined,
    });
    if (error) throw error;
  },

  async setFunctions(
    descriptionId: string,
    functions: Array<{ functionText: string; isEssential: boolean }>,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_job_description_set_functions', {
      p_description_id: descriptionId,
      p_functions: functions.map((f) => ({
        function_text: f.functionText,
        is_essential: f.isEssential,
      })),
    });
    if (error) throw error;
  },

  async setQualifications(
    descriptionId: string,
    qualifications: Array<{
      qualificationText: string;
      qualificationType: string;
      isRequired: boolean;
    }>,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_job_description_set_qualifications', {
      p_description_id: descriptionId,
      p_qualifications: qualifications.map((q) => ({
        qualification_text: q.qualificationText,
        qualification_type: q.qualificationType,
        is_required: q.isRequired,
      })),
    });
    if (error) throw error;
  },

  async setCompetencies(
    descriptionId: string,
    competencies: Array<{ competencyId: string; weight?: number | null }>,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_job_description_set_competencies', {
      p_description_id: descriptionId,
      p_competencies: competencies.map((c) => ({
        competency_id: c.competencyId,
        weight: c.weight ?? null,
      })),
    });
    if (error) throw error;
  },

  /**
   * Archives the incumbent version in the same transaction. Refuses without a
   * summary and at least one essential function — a description with none
   * cannot support an accommodation analysis.
   */
  async publish(descriptionId: string, effectiveFrom?: string | null): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_job_description_publish', {
      p_description_id: descriptionId,
      p_effective_from: effectiveFrom ?? undefined,
    });
    if (error) throw error;
  },

  // ----- Competencies -----

  async listCompetencies(
    companyId: string,
    industry?: string | null,
    activeOnly = true,
  ): Promise<MhdCompetency[]> {
    const { data, error } = await supabaseClient.rpc('mhd_competency_list', {
      p_company_id: companyId,
      p_industry: industry ?? undefined,
      p_active_only: activeOnly,
    });
    if (error) throw error;
    return ((data ?? []) as MhdCompetencyRpcRow[]).map(mapCompetency);
  },

  async upsertCompetency(input: MhdUpsertCompetencyInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_competency_upsert', {
      // Sent explicitly as null rather than omitted: null MEANS global here, and
      // an omitted argument would take the default instead of expressing intent.
      p_company_id: input.companyId as string,
      p_competency_name: input.competencyName.trim(),
      p_description: input.description ?? undefined,
      p_category: trimmedOrUndefined(input.category),
      p_industry: input.industry ?? 'GENERAL',
      p_is_regulated: input.isRegulated ?? false,
      p_competency_id: input.competencyId ?? undefined,
    });
    if (error) throw error;
    return data as string;
  },

  // ----- Assignments -----

  async listAssignmentsForPerson(personId: string): Promise<MhdJobAssignment[]> {
    const { data, error } = await supabaseClient.rpc('mhd_job_assignment_list_for_person', {
      p_person_id: personId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdJobAssignmentRpcRow[]).map(mapAssignment);
  },

  /** Closes the current assignment rather than overwriting it — history survives. */
  async assign(input: MhdAssignJobInput): Promise<string> {
    const { data, error } = await supabaseClient.rpc('mhd_job_assignment_assign', {
      p_person_id: input.personId,
      p_job_id: input.jobId,
      p_effective_from: input.effectiveFrom,
      p_manager_person_id: input.managerPersonId ?? undefined,
      p_note: trimmedOrUndefined(input.note),
    });
    if (error) throw error;
    return data as string;
  },

  // ----- The consumer contract -----

  /**
   * THE call Performance v2 and a future ATS use, and the only one they need.
   *
   * Resolves the description version in force for this person ON THE GIVEN
   * DATE — not the version published today. Pass the date the consuming record
   * belongs to (a review's period end, say) and stamp the returned
   * `descriptionId` onto that record. That stamp is what keeps it reproducible
   * once the description moves on.
   */
  async getPublishedForPerson(
    personId: string,
    asOf?: string | null,
  ): Promise<MhdPublishedJobDescription | null> {
    const { data, error } = await supabaseClient.rpc('mhd_job_get_published_for_person', {
      p_person_id: personId,
      p_as_of: asOf ?? undefined,
    });
    if (error) throw error;
    const row = ((data ?? []) as unknown as MhdPublishedJobRpcRow[])[0];
    return row ? mapPublishedDescription(row) : null;
  },

  async careerOneStopOccupationLookup(input: MhdCareerOneStopOccupationLookupInput): Promise<MhdCareerOneStopOccupationLookupResponse> {
    const { data, error } = await supabaseClient.functions.invoke('careeronestop-occupation-lookup', {
      body: { onetSocCode: input.onetSocCode, location: input.location, includeWages: false, includeDuties: true },
    });
    if (error) throw error;
    const response = data as MhdCareerOneStopOccupationLookupResponse | undefined;
    if (response?.success === false) throw new Error(response.error);
    return response as MhdCareerOneStopOccupationLookupResponse;
  },

  async onetOccupationSearch(input: MhdOnetOccupationSearchInput): Promise<MhdOnetOccupationSearchResponse> {
    const { data, error } = await supabaseClient.functions.invoke('onet-online-lookup', {
      body: { mode: 'search', keyword: input.keyword },
    });
    if (error) throw error;
    const response = data as MhdOnetOccupationSearchResponse | undefined;
    if (response?.success === false) throw new Error(response.error);
    return response as MhdOnetOccupationSearchResponse;
  },

  async onetOccupationLookup(input: MhdOnetOccupationLookupInput): Promise<MhdOnetOccupationLookupResponse> {
    const { data, error } = await supabaseClient.functions.invoke('onet-online-lookup', {
      body: { mode: 'occupation', onetSocCode: input.onetSocCode, includeDuties: input.includeDuties ?? false, includeRequirements: input.includeRequirements ?? false },
    });
    if (error) throw error;
    const response = data as MhdOnetOccupationLookupResponse | undefined;
    if (response?.success === false) throw new Error(response.error);
    return response as MhdOnetOccupationLookupResponse;
  },
};
