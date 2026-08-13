export type MhdCalendarSourceType =
  | 'TASK'
  | 'ACTIVITY'
  | 'LEAVE'
  | 'ACCOMMODATION'
  | 'MILEAGE'
  | 'FORM';

export interface MhdCalendarEvent {
  eventId: string;
  sourceType: MhdCalendarSourceType;
  sourceId: string;
  title: string;
  eventDate: string;
  eventEnd: string | null;
  personId: string;
  personName: string;
  status: string | null;
  companyId: string;
  linkPath: string;
}

export type MhdCalendarView = 'MONTH' | 'WEEK' | 'AGENDA';

export interface MhdCalendarFilters {
  companyId: string | null;
  personIds: string[];
  sourceTypes: MhdCalendarSourceType[];
}

export const MHD_CALENDAR_SOURCE_TYPES = [
  'TASK',
  'ACTIVITY',
  'LEAVE',
  'ACCOMMODATION',
  'MILEAGE',
  'FORM',
] as const satisfies readonly MhdCalendarSourceType[];

export function mhdFormatCalendarSourceType(sourceType: MhdCalendarSourceType): string {
  const labels: Record<MhdCalendarSourceType, string> = {
    TASK: 'Tasks',
    ACTIVITY: 'Activities',
    LEAVE: 'Leave',
    ACCOMMODATION: 'Accommodations',
    MILEAGE: 'Mileage',
    FORM: 'Forms',
  };

  return labels[sourceType];
}
