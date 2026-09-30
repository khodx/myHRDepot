import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import type { MhdCalendarView } from '../Types';

export function mhdCalendarRangeForView(anchorDate: Date, view: MhdCalendarView) {
  if (view === 'AGENDA') {
    return {
      start: anchorDate,
      end: addDays(anchorDate, 30),
    };
  }

  if (view === 'WEEK') {
    return {
      start: startOfWeek(anchorDate),
      end: endOfWeek(anchorDate),
    };
  }

  return {
    start: startOfWeek(startOfMonth(anchorDate)),
    end: endOfWeek(endOfMonth(anchorDate)),
  };
}
