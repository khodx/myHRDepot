import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type {
  MhdCreateMemorandumInput,
  MhdMemorandumDeliveryRpcRow,
  MhdMemorandumDelivery,
  MhdMemorandumDetail,
  MhdMemorandumDetailRpcRow,
  MhdMemorandumListItem,
  MhdMemorandumListItemRpcRow,
  MhdMyMemorandum,
  MhdMyMemorandumRpcRow,
  MhdPublishMemorandumInput,
} from './Types';

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function mapListItem(row: MhdMemorandumListItemRpcRow): MhdMemorandumListItem {
  return {
    id: row.id,
    referenceId: row.reference_id,
    title: row.title,
    category: row.category,
    requiresAcknowledgment: row.requires_acknowledgment,
    status: row.status,
    audienceLabel: row.audience_label,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    recipientCount: toNumber(row.recipient_count),
  };
}

function mapDetail(row: MhdMemorandumDetailRpcRow): MhdMemorandumDetail {
  return {
    id: row.id,
    referenceId: row.reference_id,
    companyId: row.company_id,
    title: row.title,
    body: row.body,
    category: row.category,
    requiresAcknowledgment: row.requires_acknowledgment,
    status: row.status,
    audienceLabel: row.audience_label,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

function mapMyMemorandum(row: MhdMyMemorandumRpcRow): MhdMyMemorandum {
  return {
    id: row.id,
    referenceId: row.reference_id,
    title: row.title,
    category: row.category,
    requiresAcknowledgment: row.requires_acknowledgment,
    publishedAt: row.published_at,
    readAt: row.read_at,
    acknowledgmentId: row.acknowledgment_id,
    acknowledgmentStatus: row.acknowledgment_status,
  };
}

function mapDelivery(row: MhdMemorandumDeliveryRpcRow): MhdMemorandumDelivery {
  return {
    personId: row.person_id,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    acknowledgmentStatus: row.acknowledgment_status,
  };
}

export const mhdMemorandumsService = {
  async listMemorandums(companyId: string, status?: string | null): Promise<MhdMemorandumListItem[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_memorandums', {
      p_company_id: companyId,
      p_status: status ?? undefined,
    });
    if (error) throw error;
    return ((data ?? []) as MhdMemorandumListItemRpcRow[]).map(mapListItem);
  },

  async getMemorandum(id: string): Promise<MhdMemorandumDetail | null> {
    const { data, error } = await supabaseClient.rpc('mhd_get_memorandum', { p_id: id });
    if (error) throw error;
    const row = ((data ?? []) as unknown as MhdMemorandumDetailRpcRow[])[0];
    return row ? mapDetail(row) : null;
  },

  async listMyMemorandums(): Promise<MhdMyMemorandum[]> {
    const { data, error } = await supabaseClient.rpc('mhd_list_my_memorandums');
    if (error) throw error;
    return ((data ?? []) as MhdMyMemorandumRpcRow[]).map(mapMyMemorandum);
  },

  async listDeliveries(memorandumId: string): Promise<MhdMemorandumDelivery[]> {
    const { data, error } = await supabaseClient.rpc('mhd_memorandum_delivery_board', {
      p_memorandum_id: memorandumId,
    });
    if (error) throw error;
    return ((data ?? []) as MhdMemorandumDeliveryRpcRow[]).map(mapDelivery);
  },

  async createMemorandum(input: MhdCreateMemorandumInput): Promise<{ id: string }> {
    const { data, error } = await supabaseClient.rpc(
      'mhd_create_memorandum',
      {
        p_company_id: input.companyId,
        p_title: input.title.trim(),
        p_body: input.body.trim(),
        p_category: input.category ?? 'GENERAL',
        p_requires_acknowledgment: input.requiresAcknowledgment ?? false,
      } as never,
    );
    if (error) throw error;
    const row = ((data ?? []) as Array<{ id: string }>)[0];
    if (!row) throw new Error('Memorandum creation returned no row.');
    return { id: row.id };
  },

  async publishMemorandum(input: MhdPublishMemorandumInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_publish_memorandum', {
      p_memorandum_id: input.memorandumId,
      p_recipient_person_ids: input.recipientPersonIds,
      p_audience_label: input.audienceLabel ?? undefined,
      p_send_email: input.sendEmail ?? false,
    });
    if (error) throw error;
  },

  async markRead(memorandumId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_mark_memorandum_read', {
      p_memorandum_id: memorandumId,
    });
    if (error) throw error;
  },

  async acknowledge(acknowledgmentId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_acknowledge_memorandum', {
      p_acknowledgment_id: acknowledgmentId,
    });
    if (error) throw error;
  },
};
