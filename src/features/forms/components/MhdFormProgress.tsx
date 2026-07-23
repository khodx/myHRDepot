import { MhdProgressBar } from '@/components/ui/MhdProgressBar';

interface MhdFormProgressProps {
  currentPageIndex: number;
  totalPages: number;
}

export function MhdFormProgress({ currentPageIndex, totalPages }: MhdFormProgressProps) {
  const progressPercent = totalPages <= 1 ? 100 : ((currentPageIndex + 1) / totalPages) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {currentPageIndex + 1}</span>
        <span>{totalPages} total</span>
      </div>
      <MhdProgressBar percent={progressPercent} />
    </div>
  );
}
