import { useMhdAuth } from '@/features/authentication/Hook';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdPageHeader } from '@/components/ui/MhdPageHeader';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import { useMhdTrainingLeaderboard } from '../Hook';

/** `/training/leaderboard` — a read-only company leaderboard. */
export function MhdTrainingLeaderboardPage() {
  const { profile } = useMhdAuth();
  const companyId = profile?.companyId ?? '';
  const leaderboard = useMhdTrainingLeaderboard({ companyId });
  const rows = leaderboard.data ?? [];

  if (!companyId) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">No company is associated with your account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MhdPageHeader
        title="Training leaderboard"
        description="A read-only view of company training points and current streaks for people who have opted in."
      />

      {leaderboard.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading leaderboard…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one has opted in to the leaderboard yet.</p>
      ) : (
        <MhdCard className="overflow-hidden p-0">
          <MhdTable>
            <thead>
              <tr>
                <MhdTh>Rank</MhdTh>
                <MhdTh>Person</MhdTh>
                <MhdTh className="text-right">Total points</MhdTh>
                <MhdTh className="text-right">Current streak days</MhdTh>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <MhdTr key={row.personId}>
                  <MhdTd>{index + 1}</MhdTd>
                  <MhdTd className="font-medium">{row.personDisplayName}</MhdTd>
                  <MhdTd className="text-right">{row.totalPoints}</MhdTd>
                  <MhdTd className="text-right">{row.currentStreakDays}</MhdTd>
                </MhdTr>
              ))}
            </tbody>
          </MhdTable>
        </MhdCard>
      )}
    </div>
  );
}
