import { mhdFormatActivityType, type MhdActivityType } from '../Types';

const TYPE_STYLES: Record<MhdActivityType, string> = {
  ONE_ON_ONE: 'bg-violet-100 text-violet-800',
  COACHING_SESSION: 'bg-purple-100 text-purple-800',
  MEETING: 'bg-blue-100 text-blue-800',
  PHONE_CALL: 'bg-cyan-100 text-cyan-800',
  EMAIL: 'bg-sky-100 text-sky-800',
  SITE_VISIT: 'bg-teal-100 text-teal-800',
  COMPANY_EVENT: 'bg-indigo-100 text-indigo-800',
  OTHER: 'bg-neutral-100 text-neutral-600',
};

interface Props {
  activityType: MhdActivityType;
}

export function MhdActivityTypeBadge({ activityType }: Props) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[activityType]}`}>
      {mhdFormatActivityType(activityType)}
    </span>
  );
}
