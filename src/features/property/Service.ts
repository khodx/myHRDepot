import { supabaseClient } from '@/lib/supabase/supabaseClient';
import type { Database } from '@/types/database.types';
import type {
  MhdCreatePropertyItemInput,
  MhdIssuePropertyInput,
  MhdPropertyAssignment,
  MhdPropertyItem,
  MhdPropertyDispositionStatus,
  MhdReturnPropertyInput,
  MhdRpcPropertyAssignmentRow,
  MhdRpcPropertyItemRow,
  MhdUpdatePropertyItemInput,
} from './Types';

type DbFunctions = Database['public']['Functions'];
type MhdPropertyMutationResultRow = DbFunctions['mhd_create_property_item']['Returns'][number];
type MhdPropertyIssueResultRow = DbFunctions['mhd_issue_property']['Returns'][number];

function trimmedOrUndefined(value?: string | null): string | undefined {
  if (value === undefined || value === null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function trimmedOrEmpty(value?: string | null): string {
  return value?.trim() ?? '';
}

function mapPropertyItemRow(row: MhdRpcPropertyItemRow): MhdPropertyItem {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdPropertyItem['referenceId'],
    companyId: row.company_id,
    category: row.category as MhdPropertyItem['category'],
    name: row.name,
    description: row.description,
    serialNumber: row.serial_number,
    quantityTotal: row.quantity_total,
    quantityAvailable: row.quantity_available,
    unitCost: row.unit_cost,
    acquisitionDate: row.acquisition_date,
    status: row.status as MhdPropertyItem['status'],
    conditionNotes: row.condition_notes,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

function mapPropertyAssignmentRow(row: MhdRpcPropertyAssignmentRow): MhdPropertyAssignment {
  return {
    id: row.id,
    referenceId: row.reference_id as MhdPropertyAssignment['referenceId'],
    companyId: row.company_id,
    propertyItemId: row.property_item_id,
    personId: row.person_id,
    itemName: row.item_name,
    personDisplayName: row.person_display_name,
    quantity: row.quantity,
    status: row.status as MhdPropertyAssignment['status'],
    issuedAt: row.issued_at,
    issuedBy: row.issued_by,
    issuerDisplayName: row.issuer_display_name,
    issuerTitle: row.issuer_title,
    issuanceConditionNotes: row.issuance_condition_notes,
    employeeAckReceipt: row.employee_ack_receipt,
    employeeAckMaintain: row.employee_ack_maintain,
    employeeAckReportLoss: row.employee_ack_report_loss,
    employeeAckPolicy: row.employee_ack_policy,
    employeeSignatureName: row.employee_signature_name,
    employeeSignatureAt: row.employee_signature_at,
    returnedAt: row.returned_at,
    receivedBy: row.received_by,
    receiverDisplayName: row.receiver_display_name,
    receiverTitle: row.receiver_title,
    returnConditionNotes: row.return_condition_notes,
    returnAckReturned: row.return_ack_returned,
    returnAckMaintained: row.return_ack_maintained,
    returnAckLiability: row.return_ack_liability,
    employeeReturnSignatureName: row.employee_return_signature_name,
    employeeReturnSignatureAt: row.employee_return_signature_at,
  };
}

export const mhdPropertyService = {
  async listItems(companyId: string): Promise<MhdPropertyItem[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_property_items', { p_company_id: companyId })
      .returns<MhdRpcPropertyItemRow[]>();

    if (error) {
      throw new Error(`Unable to load property items: ${error.message}`);
    }

    return (data ?? []).map(mapPropertyItemRow);
  },

  async getItemById(companyId: string, itemId: string): Promise<MhdPropertyItem> {
    const items = await mhdPropertyService.listItems(companyId);
    const item = items.find((candidate) => candidate.id === itemId);

    if (!item) {
      throw new Error(`Property item not found: ${itemId}`);
    }

    return item;
  },

  async createItem(input: MhdCreatePropertyItemInput): Promise<MhdPropertyItem> {
    const { data, error } = await supabaseClient
      .rpc('mhd_create_property_item', {
        p_company_id: input.companyId,
        p_category: input.category,
        p_name: input.name.trim(),
        ...(trimmedOrUndefined(input.description)
          ? { p_description: trimmedOrUndefined(input.description) }
          : {}),
        ...(trimmedOrUndefined(input.serialNumber)
          ? { p_serial_number: trimmedOrUndefined(input.serialNumber) }
          : {}),
        ...(input.quantityTotal !== undefined ? { p_quantity_total: input.quantityTotal } : {}),
        ...(input.unitCost != null ? { p_unit_cost: input.unitCost } : {}),
        ...(trimmedOrUndefined(input.acquisitionDate)
          ? { p_acquisition_date: trimmedOrUndefined(input.acquisitionDate) }
          : {}),
      })
      .returns<MhdPropertyMutationResultRow[]>();

    if (error) {
      throw new Error(`Unable to create property item: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to create property item: no record returned.');
    }

    return mhdPropertyService.getItemById(input.companyId, row.id);
  },

  async updateItem(itemId: string, input: MhdUpdatePropertyItemInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_update_property_item', {
      p_item_id: itemId,
      p_name: input.name.trim(),
      p_description: trimmedOrEmpty(input.description),
      p_status: input.status,
      p_condition_notes: trimmedOrEmpty(input.conditionNotes),
    });

    if (error) {
      throw new Error(`Unable to update property item: ${error.message}`);
    }
  },

  async deleteItem(itemId: string): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_delete_property_item', {
      p_item_id: itemId,
    });

    if (error) {
      throw new Error(`Unable to delete property item: ${error.message}`);
    }
  },

  async listAssignments(filter: {
    propertyItemId?: string;
    personId?: string;
  }): Promise<MhdPropertyAssignment[]> {
    const { data, error } = await supabaseClient
      .rpc('mhd_list_property_assignments', {
        ...(filter.propertyItemId ? { p_property_item_id: filter.propertyItemId } : {}),
        ...(filter.personId ? { p_person_id: filter.personId } : {}),
      })
      .returns<MhdRpcPropertyAssignmentRow[]>();

    if (error) {
      throw new Error(`Unable to load property assignments: ${error.message}`);
    }

    return (data ?? []).map(mapPropertyAssignmentRow);
  },

  async issue(input: MhdIssuePropertyInput): Promise<MhdPropertyAssignment> {
    const { data, error } = await supabaseClient
      .rpc('mhd_issue_property', {
        p_property_item_id: input.propertyItemId,
        p_person_id: input.personId,
        p_quantity: input.quantity,
        p_issuer_title: trimmedOrEmpty(input.issuerTitle),
        p_issuance_condition_notes: trimmedOrEmpty(input.issuanceConditionNotes),
        p_employee_ack_receipt: input.employeeAckReceipt,
        p_employee_ack_maintain: input.employeeAckMaintain,
        p_employee_ack_report_loss: input.employeeAckReportLoss,
        p_employee_ack_policy: input.employeeAckPolicy,
        p_employee_signature_name: input.employeeSignatureName.trim(),
      })
      .returns<MhdPropertyIssueResultRow[]>();

    if (error) {
      throw new Error(`Unable to issue property: ${error.message}`);
    }

    const row = data?.[0];
    if (!row) {
      throw new Error('Unable to issue property: no record returned.');
    }

    const assignments = await mhdPropertyService.listAssignments({
      propertyItemId: input.propertyItemId,
    });
    const created = assignments.find((assignment) => assignment.id === row.id);

    if (!created) {
      throw new Error('Unable to issue property: record not found after insert.');
    }

    return created;
  },

  async returnItem(assignmentId: string, input: MhdReturnPropertyInput): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_return_property', {
      p_assignment_id: assignmentId,
      p_receiver_title: trimmedOrEmpty(input.receiverTitle),
      p_return_condition_notes: trimmedOrEmpty(input.returnConditionNotes),
      p_return_ack_returned: input.returnAckReturned,
      p_return_ack_maintained: input.returnAckMaintained,
      p_return_ack_liability: input.returnAckLiability,
      p_employee_return_signature_name: input.employeeReturnSignatureName.trim(),
    });

    if (error) {
      throw new Error(`Unable to return property: ${error.message}`);
    }
  },

  async markLostOrDamaged(
    assignmentId: string,
    status: MhdPropertyDispositionStatus,
    notes?: string | null,
  ): Promise<void> {
    const { error } = await supabaseClient.rpc('mhd_mark_property_lost_or_damaged', {
      p_assignment_id: assignmentId,
      p_new_status: status,
      ...(trimmedOrUndefined(notes) ? { p_notes: trimmedOrUndefined(notes) } : {}),
    });

    if (error) {
      throw new Error(`Unable to mark property ${status.toLowerCase()}: ${error.message}`);
    }
  },
};
