import { useMhdFeedbackAggregate, useMhdReviewParticipants } from '../Hook-v2';
import {
  MHD_PARTICIPANT_TYPES,
  mhdFeedbackReleaseState,
  mhdFeedbackWithheldMessage,
  mhdFormatParticipantType,
  type MhdFeedbackAggregateGroup,
  type MhdParticipantType,
} from '../Types-v2';

interface Props {
  reviewId: string;
  /** The company's release threshold, from `useMhdFeedbackThreshold`. */
  threshold: number;
}

/**
 * The 360 aggregate — the ONLY place peer and upward feedback is ever shown, and
 * never as individual responses.
 *
 * The single hardest thing this component does is render the WITHHELD state
 * correctly. When peers were invited but too few have answered, the panel must
 * say so in words. Rendering an empty section instead would tell the subject
 * "your peers had nothing to say about you" — which is false, defamatory, and
 * the exact failure the threshold exists to prevent. `mhdFeedbackReleaseState`
 * distinguishes the three cases; this component must honour all three.
 */
export function Mhd360FeedbackPanel({ reviewId, threshold }: Props) {
  const aggregate = useMhdFeedbackAggregate(reviewId);
  const participants = useMhdReviewParticipants(reviewId);

  if (aggregate.isLoading || participants.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading feedback…</p>;
  }

  const groups = aggregate.data ?? [];
  const parts = participants.data ?? [];

  // Group the released aggregate rows by participant type for display.
  const byType = new Map<MhdParticipantType, MhdFeedbackAggregateGroup[]>();
  for (const group of groups) {
    const list = byType.get(group.participantType) ?? [];
    list.push(group);
    byType.set(group.participantType, list);
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-base font-semibold text-foreground">360 feedback</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Peer and upward feedback is shown only in aggregate, and only once enough people have
          answered that no individual response can be identified.
        </p>
      </header>

      {MHD_PARTICIPANT_TYPES.map((type) => {
        const state = mhdFeedbackReleaseState(type, groups, parts);

        // NOT_INVITED: nobody of this type was asked. Show nothing and explain nothing — there is
        // genuinely nothing here.
        if (state === 'NOT_INVITED') return null;

        return (
          <div key={type} className="rounded-md border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {mhdFormatParticipantType(type)}
            </h3>

            {state === 'WITHHELD' ? (
              // The load-bearing branch. Words, not an empty list.
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {mhdFeedbackWithheldMessage(threshold)}
              </p>
            ) : (
              <div className="mt-2 space-y-3">
                {(byType.get(type) ?? []).map((group, index) => (
                  <div key={`${type}-${index}`} className="border-t border-border pt-2 first:border-0 first:pt-0">
                    <p className="text-sm font-medium text-foreground">
                      {group.competencyName ?? group.sectionTitle ?? 'General'}
                    </p>
                    <p className="text-sm text-foreground">
                      {group.meanRating !== null ? (
                        <>
                          Mean {group.meanRating.toFixed(1)} / 5
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({group.responseCount} responses)
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {group.responseCount} responses
                        </span>
                      )}
                    </p>
                    {/*
                      commentsReleased false = the company has verbatim release off, a policy
                      choice; an empty array with commentsReleased true = nobody wrote anything.
                      The two must not look alike.
                    */}
                    {group.commentsReleased && group.comments.length > 0 ? (
                      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                        {group.comments.map((comment, commentIndex) => (
                          <li key={commentIndex} className="border-l-2 border-border pl-2 italic">
                            {comment}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
