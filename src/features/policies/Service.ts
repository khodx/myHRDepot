import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdAcknowledgePolicyInput,
  MhdAssignPolicyAcknowledgmentInput,
  MhdCreatePolicyInput,
  MhdForkPolicyInput,
  MhdMyPolicyAcknowledgment,
  MhdMyPolicyAcknowledgmentRpcRow,
  MhdPolicy,
  MhdPolicyAckBoardRow,
  MhdPolicyAckBoardRpcRow,
  MhdPolicyMutationRpcRow,
  MhdPolicyRpcRow,
  MhdPublishPolicyVersionInput,
} from './Types';

function trimmedOrUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : undefined;
}

function mapPolicy(row: MhdPolicyRpcRow): MhdPolicy {
  return {
    id: row.id,
    companyId: row.company_id,
    sourcePolicyId: row.source_policy_id,
    title: row.title,
    category: row.category,
    jurisdiction: row.jurisdiction,
    isActive: row.is_active,
    isLibrary: row.is_library,
    currentVersionId: row.current_version_id,
  };
}

function mapMyAck(row: MhdMyPolicyAcknowledgmentRpcRow): MhdMyPolicyAcknowledgment {
  return {
    id: row.id,
    referenceId: row.reference_id,
    policyTitle: row.policy_title,
    policyVersionId: row.policy_version_id,
    status: row.status as MhdMyPolicyAcknowledgment['status'],
    assignedAt: row.assigned_at,
    signedAt: row.signed_at,
  };
}

function mapAckBoard(row: MhdPolicyAckBoardRpcRow): MhdPolicyAckBoardRow {
  return {
    id: row.id,
    personId: row.person_id,
    status: row.status as MhdPolicyAckBoardRow['status'],
    assignedAt: row.assigned_at,
    signedAt: row.signed_at,
  };
}

export const mhdPoliciesService = {
  async canManageLibrary(companyId: string | null): Promise<boolean> {
    const { data, error } = await supabaseClient.rpc(
      'mhd_can_manage_policy_library',
      { p_company_id: companyId } as never,
    );
    if (error) throw error;
    return Boolean(data);
  },

  async listLibrary(companyId: string | null, category?: string | null): Promise<MhdPolicy[]> {
    if (!companyId) return [];
    const { data, error } = await supabaseClient.rpc('mhd_list_policy_library', {
      p_company_id: companyId,
      p_category: category && category !== 'ALL' ? category : undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdPolicyRpcRow[]).map(mapPolicy);
  },

  async createPolicy(input: MhdCreatePolicyInput): Promise<{ id: string }> {
    const { data, error } = await supabaseClient.rpc(
      'mhd_create_policy',
      {
        p_company_id: input.companyId,
        p_title: input.title.trim(),
        p_category: input.category ?? 'GENERAL',
        p_jurisdiction: trimmedOrUndefined(input.jurisdiction),
        p_source_policy_id: input.sourcePolicyId ?? undefined,
      } as never,
    );
    if (error) throw error;
    const row = ((data ?? []) as MhdPolicyMutationRpcRow[])[0];
    if (!row) throw new Error('Policy creation returned no row.');
    return { id: row.id };
  },

  async forkPolicy(input: MhdForkPolicyInput): Promise<{ id: string }> {
    const { data, error } = await supabaseClient.rpc('mhd_fork_policy', {
      p_source_policy_id: input.sourcePolicyId,
      p_company_id: input.companyId,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdPolicyMutationRpcRow[])[0];
    if (!row) throw new Error('Policy fork returned no row.');
    return { id: row.id };
  },

  async publishVersion(input: MhdPublishPolicyVersionInput): Promise<{ id: string }> {
    const { data, error } = await supabaseClient.rpc('mhd_publish_policy_version', {
      p_policy_id: input.policyId,
      p_content: input.content,
      p_requires_signature: input.requiresSignature,
    });
    if (error) throw error;
    const row = ((data ?? []) as MhdPolicyMutationRpcRow[])[0];
    if (!row) throw new Error('Policy publish returned no row.');
    return { id: row.id };
  },

  async assignAcknowledgment(input: MhdAssignPolicyAcknowledgmentInput): Promise<string[]> {
    const { data, error } = await supabaseClient.rpc('mhd_assign_policy_acknowledgment', {
      p_policy_version_id: input.policyVersionId,
      p_person_ids: input.personIds,
    });
    if (error) throw error;
    return (data ?? []) as string[];
  },

  async acknowledge(input: MhdAcknowledgePolicyInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_acknowledge_policy', {
      p_acknowledgment_id: input.acknowledgmentId,
      p_esignature_request_id: trimmedOrUndefined(input.esignatureRequestId),
    });
    if (error) throw error;
  },

  async myAcknowledgments(): Promise<MhdMyPolicyAcknowledgment[]> {
    const { data, error } = await supabaseClient.rpc(
      'mhd_my_policy_acknowledgments',
      undefined,
    );
    if (error) throw error;
    return ((data ?? []) as MhdMyPolicyAcknowledgmentRpcRow[]).map(mapMyAck);
  },

  async ackBoard(versionId: string): Promise<MhdPolicyAckBoardRow[]> {
    const { data, error } = await supabaseClient.rpc('mhd_policy_ack_board', {
      p_policy_version_id: versionId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdPolicyAckBoardRpcRow[]).map(mapAckBoard);
  },
};
