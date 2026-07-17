interface MhdFormProgressProps {
  currentPageIndex: number;
  totalPages: number;
}

export function MhdFormProgress({ currentPageIndex, totalPages }: MhdFormProgressProps) {
  const progressPercent = totalPages <= 1 ? 100 : ((currentPageIndex + 1) / totalPages) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Page {currentPageIndex + 1}</span>
        <span>{totalPages} total</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}
