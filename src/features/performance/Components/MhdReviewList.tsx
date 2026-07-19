import { AlarmClock, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MhdPerformanceReview } from '../Types';
import { mhdIsReviewOverdue } from '../Types';
import { MhdRatingStars } from './MhdRatingStars';
import { MhdReviewStatusBadge } from './MhdReviewStatusBadge';
import { MhdReviewTypeBadge } from './MhdReviewTypeBadge';

interface Props {
  reviews: MhdPerformanceReview[];
}

function formatDate(value: string | null): string {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '—';
}

export function MhdReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-neutral-400">
        <ClipboardCheck className="mb-2 h-8 w-8" />
        <p className="text-sm">No reviews match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-neutral-500">
            <th className="py-2 pr-4">Review</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Rating</th>
            <th className="py-2 pr-4">Reviewer</th>
            <th className="py-2 pr-4">Period</th>
            <th className="py-2 pr-4">Due</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => {
            const isOverdue = mhdIsReviewOverdue(review);
            return (
              <tr key={review.id} className="border-b last:border-0 hover:bg-neutral-50">
                <td className="py-2 pr-4">
                  <Link to={`/performance/reviews/${review.id}`} className="font-medium hover:underline">
                    {review.personDisplayName ?? 'Unknown person'}
                  </Link>
                  <div className="text-xs text-neutral-400">{review.referenceId}</div>
                </td>
                <td className="py-2 pr-4">
                  <MhdReviewTypeBadge reviewType={review.reviewType} />
                </td>
                <td className="py-2 pr-4">
                  <MhdReviewStatusBadge status={review.status} />
                </td>
                <td className="py-2 pr-4">
                  <MhdRatingStars value={review.overallRating} size="sm" />
                </td>
                <td className="py-2 pr-4">{review.reviewerDisplayName ?? '—'}</td>
                <td className="py-2 pr-4 text-neutral-600">
                  {formatDate(review.reviewPeriodStart)} – {formatDate(review.reviewPeriodEnd)}
                </td>
                <td className="py-2 pr-4">
                  {review.dueDate ? (
                    <span className={`inline-flex items-center gap-1 ${isOverdue ? 'font-medium text-red-600' : 'text-neutral-600'}`}>
                      {isOverdue ? <AlarmClock className="h-4 w-4" aria-label="Overdue" /> : null}
                      {formatDate(review.dueDate)}
                    </span>
                  ) : (
                    <span className="text-neutral-400">No due date</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
