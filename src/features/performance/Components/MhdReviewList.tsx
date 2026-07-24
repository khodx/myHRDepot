import { AlarmClock, ClipboardCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdEmptyState } from '@/components/ui/MhdEmptyState';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
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
      <MhdCard className="border-dashed">
        <MhdEmptyState
          icon={ClipboardCheck}
          title="No reviews found"
          description="No reviews match the current filters."
        />
      </MhdCard>
    );
  }

  return (
    <MhdCard className="overflow-hidden p-0">
      <MhdTable>
        <thead>
          <tr>
            <MhdTh>Review</MhdTh>
            <MhdTh>Type</MhdTh>
            <MhdTh>Status</MhdTh>
            <MhdTh>Rating</MhdTh>
            <MhdTh>Reviewer</MhdTh>
            <MhdTh>Period</MhdTh>
            <MhdTh>Due</MhdTh>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => {
            const isOverdue = mhdIsReviewOverdue(review);
            return (
              <MhdTr key={review.id}>
                <MhdTd>
                  <Link
                    to={`/performance/reviews/${review.id}`}
                    className="font-medium text-accent hover:text-accent-hover"
                  >
                    {review.personDisplayName ?? 'Unknown person'}
                  </Link>
                  <div className="text-xs text-muted-foreground">{review.referenceId}</div>
                </MhdTd>
                <MhdTd>
                  <MhdReviewTypeBadge reviewType={review.reviewType} />
                </MhdTd>
                <MhdTd>
                  <MhdReviewStatusBadge status={review.status} />
                </MhdTd>
                <MhdTd>
                  <MhdRatingStars value={review.overallRating} size="sm" />
                </MhdTd>
                <MhdTd>{review.reviewerDisplayName ?? '—'}</MhdTd>
                <MhdTd className="text-muted-foreground">
                  {formatDate(review.reviewPeriodStart)} – {formatDate(review.reviewPeriodEnd)}
                </MhdTd>
                <MhdTd>
                  {review.dueDate ? (
                    <span
                      className={`inline-flex items-center gap-1 ${isOverdue ? 'font-medium text-red-600' : 'text-muted-foreground'}`}
                    >
                      {isOverdue ? <AlarmClock className="h-4 w-4" aria-label="Overdue" /> : null}
                      {formatDate(review.dueDate)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No due date</span>
                  )}
                </MhdTd>
              </MhdTr>
            );
          })}
        </tbody>
      </MhdTable>
    </MhdCard>
  );
}
