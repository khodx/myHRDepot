import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock('@/lib/supabase/supabaseClient', () => ({
  supabaseClient: { rpc: mockRpc },
}));

const { mhdPropertyService } = await import('../Service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('mhdPropertyService', () => {
  describe('listItems', () => {
    it('returns mapped property items for a company', async () => {
      mockRpc.mockReturnValueOnce({
        returns: () =>
          Promise.resolve({
            data: [
              {
                id: 'item-1',
                reference_id: 'PROP-000001',
                company_id: 'comp-1',
                category: 'ELECTRONICS',
                name: 'MacBook Pro 14"',
                description: null,
                serial_number: null,
                quantity_total: 3,
                quantity_available: 2,
                unit_cost: null,
                acquisition_date: null,
                status: 'ASSIGNED',
                condition_notes: null,
                created_at: '2026-01-01T00:00:00Z',
                created_by: 'user-1',
              },
            ],
            error: null,
          }),
      });

      const result = await mhdPropertyService.listItems('comp-1');
      expect(mockRpc).toHaveBeenCalledWith('mhd_list_property_items', { p_company_id: 'comp-1' });
      expect(result).toHaveLength(1);
      expect(result[0].referenceId).toBe('PROP-000001');
      expect(result[0].quantityAvailable).toBe(2);
    });

    it('throws a verb-prefixed error on database error', async () => {
      mockRpc.mockReturnValueOnce({
        returns: () => Promise.resolve({ data: null, error: { message: 'Permission denied' } }),
      });

      await expect(mhdPropertyService.listItems('comp-1')).rejects.toThrow(
        'Unable to load property items: Permission denied',
      );
    });
  });

  describe('createItem', () => {
    it('calls mhd_create_property_item and re-fetches the created item', async () => {
      mockRpc
        .mockReturnValueOnce({
          returns: () =>
            Promise.resolve({ data: [{ id: 'item-1', reference_id: 'PROP-000001' }], error: null }),
        })
        .mockReturnValueOnce({
          returns: () =>
            Promise.resolve({
              data: [
                {
                  id: 'item-1',
                  reference_id: 'PROP-000001',
                  company_id: 'comp-1',
                  category: 'EQUIPMENT',
                  name: 'Drill',
                  description: null,
                  serial_number: null,
                  quantity_total: 2,
                  quantity_available: 2,
                  unit_cost: null,
                  acquisition_date: null,
                  status: 'IN_STOCK',
                  condition_notes: null,
                  created_at: '2026-01-01T00:00:00Z',
                  created_by: 'user-1',
                },
              ],
              error: null,
            }),
        });

      const result = await mhdPropertyService.createItem({
        companyId: 'comp-1',
        category: 'EQUIPMENT',
        name: 'Drill',
        quantityTotal: 2,
      });

      expect(mockRpc).toHaveBeenCalledWith(
        'mhd_create_property_item',
        expect.objectContaining({ p_company_id: 'comp-1', p_name: 'Drill', p_quantity_total: 2 }),
      );
      expect(result.id).toBe('item-1');
      expect(result.referenceId).toBe('PROP-000001');
      expect(result.quantityAvailable).toBe(2);
    });
  });

  describe('deleteItem', () => {
    it('calls mhd_delete_property_item with only the item id', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));
      await mhdPropertyService.deleteItem('item-1');
      expect(mockRpc).toHaveBeenCalledWith('mhd_delete_property_item', {
        p_item_id: 'item-1',
      });
    });
  });

  describe('issue', () => {
    it('calls mhd_issue_property with mapped params and returns the created assignment', async () => {
      mockRpc
        .mockReturnValueOnce({
          returns: () =>
            Promise.resolve({ data: [{ id: 'asn-1', reference_id: 'PASN-000001' }], error: null }),
        })
        .mockReturnValueOnce({
          returns: () =>
            Promise.resolve({
              data: [
                {
                  id: 'asn-1',
                  reference_id: 'PASN-000001',
                  company_id: 'comp-1',
                  property_item_id: 'item-1',
                  person_id: 'person-1',
                  quantity: 1,
                  status: 'ISSUED',
                  issued_at: '2026-01-01T00:00:00Z',
                  issued_by: 'user-1',
                  issuer_display_name: 'Office Manager',
                  issuer_title: null,
                  issuance_condition_notes: null,
                  employee_ack_receipt: true,
                  employee_ack_maintain: true,
                  employee_ack_report_loss: true,
                  employee_ack_policy: true,
                  employee_signature_name: 'Jane Doe',
                  employee_signature_at: '2026-01-01T00:00:00Z',
                  returned_at: null,
                  received_by: null,
                  receiver_display_name: null,
                  receiver_title: null,
                  return_condition_notes: null,
                  return_ack_returned: null,
                  return_ack_maintained: null,
                  return_ack_liability: null,
                  employee_return_signature_name: null,
                  employee_return_signature_at: null,
                  item_name: 'MacBook Pro 14"',
                  person_display_name: 'John Smith',
                },
              ],
              error: null,
            }),
        });

      const result = await mhdPropertyService.issue({
        propertyItemId: 'item-1',
        personId: 'person-1',
        quantity: 1,
        employeeAckReceipt: true,
        employeeAckMaintain: true,
        employeeAckReportLoss: true,
        employeeAckPolicy: true,
        employeeSignatureName: 'Jane Doe',
      });

      expect(mockRpc).toHaveBeenCalledWith(
        'mhd_issue_property',
        expect.objectContaining({
          p_property_item_id: 'item-1',
          p_person_id: 'person-1',
          p_quantity: 1,
          p_employee_signature_name: 'Jane Doe',
        }),
      );
      expect(result.id).toBe('asn-1');
      expect(result.itemName).toBe('MacBook Pro 14"');
    });
  });

  describe('returnItem', () => {
    it('calls mhd_return_property with mapped params', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));

      await mhdPropertyService.returnItem('asn-1', {
        returnAckReturned: true,
        returnAckMaintained: true,
        returnAckLiability: true,
        employeeReturnSignatureName: 'Jane Doe',
      });

      expect(mockRpc).toHaveBeenCalledWith(
        'mhd_return_property',
        expect.objectContaining({
          p_assignment_id: 'asn-1',
          p_employee_return_signature_name: 'Jane Doe',
        }),
      );
    });
  });

  describe('markLostOrDamaged', () => {
    it('calls mhd_mark_property_lost_or_damaged with the given status', async () => {
      mockRpc.mockReturnValueOnce(Promise.resolve({ data: null, error: null }));
      await mhdPropertyService.markLostOrDamaged('asn-1', 'LOST', 'Left on job site');
      expect(mockRpc).toHaveBeenCalledWith('mhd_mark_property_lost_or_damaged', {
        p_assignment_id: 'asn-1',
        p_new_status: 'LOST',
        p_notes: 'Left on job site',
      });
    });
  });
});
