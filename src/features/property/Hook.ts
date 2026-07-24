import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdPersonService } from '@/features/people/Service';
import type {
  MhdCreatePropertyItemInput,
  MhdIssuePropertyInput,
  MhdPropertyDispositionStatus,
  MhdReturnPropertyInput,
  MhdUpdatePropertyItemInput,
} from './Types';
import { mhdPropertyService } from './Service';

const propertyKeys = {
  items: (companyId: string | null) => ['property-items', companyId ?? ''] as const,
  item: (companyId: string | null, itemId: string | null) =>
    ['property-item', companyId ?? '', itemId ?? ''] as const,
  assignments: (propertyItemId?: string | null, personId?: string | null) =>
    ['property-assignments', propertyItemId ?? '', personId ?? ''] as const,
  people: (companyId: string | null) => ['property-people', companyId ?? ''] as const,
};

export function useMhdPropertyItems(companyId: string | null) {
  return useQuery({
    queryKey: propertyKeys.items(companyId),
    queryFn: () => mhdPropertyService.listItems(companyId!),
    enabled: !!companyId,
  });
}

export function useMhdPropertyItem(companyId: string | null, itemId: string | null) {
  return useQuery({
    queryKey: propertyKeys.item(companyId, itemId),
    queryFn: () => mhdPropertyService.getItemById(companyId!, itemId!),
    enabled: !!companyId && !!itemId,
  });
}

export function useMhdPropertyAssignments(filter: {
  propertyItemId?: string | null;
  personId?: string | null;
}) {
  return useQuery({
    queryKey: propertyKeys.assignments(filter.propertyItemId, filter.personId),
    queryFn: () =>
      mhdPropertyService.listAssignments({
        ...(filter.propertyItemId ? { propertyItemId: filter.propertyItemId } : {}),
        ...(filter.personId ? { personId: filter.personId } : {}),
      }),
    enabled: !!(filter.propertyItemId || filter.personId),
  });
}

export function useMhdPropertyPeople(companyId: string | null, enabled = true) {
  return useQuery({
    queryKey: propertyKeys.people(companyId),
    queryFn: () => mhdPersonService.listPeople({ companyId: companyId!, searchTerm: '' }),
    enabled: enabled && !!companyId,
  });
}

export function useMhdPropertyActions() {
  const queryClient = useQueryClient();

  async function invalidatePropertyQueries() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['property-items'] }),
      queryClient.invalidateQueries({ queryKey: ['property-item'] }),
      queryClient.invalidateQueries({ queryKey: ['property-assignments'] }),
    ]);
  }

  const createItem = useMutation({
    mutationFn: (input: MhdCreatePropertyItemInput) => mhdPropertyService.createItem(input),
    onSuccess: invalidatePropertyQueries,
  });

  const updateItem = useMutation({
    mutationFn: ({ itemId, input }: { itemId: string; input: MhdUpdatePropertyItemInput }) =>
      mhdPropertyService.updateItem(itemId, input),
    onSuccess: invalidatePropertyQueries,
  });

  const deleteItem = useMutation({
    mutationFn: (itemId: string) => mhdPropertyService.deleteItem(itemId),
    onSuccess: invalidatePropertyQueries,
  });

  const issue = useMutation({
    mutationFn: (input: MhdIssuePropertyInput) => mhdPropertyService.issue(input),
    onSuccess: invalidatePropertyQueries,
  });

  const returnItem = useMutation({
    mutationFn: ({
      assignmentId,
      input,
    }: {
      assignmentId: string;
      input: MhdReturnPropertyInput;
    }) => mhdPropertyService.returnItem(assignmentId, input),
    onSuccess: invalidatePropertyQueries,
  });

  const markLostOrDamaged = useMutation({
    mutationFn: ({
      assignmentId,
      status,
      notes,
    }: {
      assignmentId: string;
      status: MhdPropertyDispositionStatus;
      notes?: string | null;
    }) => mhdPropertyService.markLostOrDamaged(assignmentId, status, notes),
    onSuccess: invalidatePropertyQueries,
  });

  return {
    createItem,
    updateItem,
    deleteItem,
    issue,
    returnItem,
    markLostOrDamaged,
  };
}
