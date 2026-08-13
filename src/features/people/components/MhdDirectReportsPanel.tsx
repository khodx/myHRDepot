import { Link } from 'react-router-dom';
import { useMhdDirectReports } from '@/features/people/Hook';

interface MhdDirectReportsPanelProps {
  personId: string | null;
}

export function MhdDirectReportsPanel({ personId }: MhdDirectReportsPanelProps) {
  const directReportsQuery = useMhdDirectReports(personId);
  const reports = directReportsQuery.data ?? [];

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-neutral-900">Direct Reports</h2>
      </header>

      {directReportsQuery.isLoading ? (
        <p className="text-sm text-neutral-500">Loading direct reports...</p>
      ) : directReportsQuery.error ? (
        <p className="text-sm text-red-600">
          {directReportsQuery.error instanceof Error
            ? directReportsQuery.error.message
            : 'Unable to load direct reports.'}
        </p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-neutral-500">No direct reports.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {reports.map((report) => (
            <li key={report.personId}>
              <Link
                className="font-medium text-accent-hover hover:underline"
                to={`/people/${report.personId}`}
              >
                {report.displayName}
              </Link>
              {report.jobTitle ? (
                <span className="text-neutral-500"> · {report.jobTitle}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
