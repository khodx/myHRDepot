import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function MhdComingSoonPage() {
  const navigate = useNavigate();

  return (
    <div
      data-testid="mhd-coming-soon-placeholder"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <Clock className="h-12 w-12 text-neutral-300" />
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Coming Soon</h1>
        <p className="mt-1 text-sm text-neutral-500">
          This module isn't part of the current release yet. Check back soon.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-neutral-500 hover:text-neutral-700 hover:underline"
        >
          Go back
        </button>
        <Button type="button" onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
