import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function MhdNotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <FileQuestion className="h-12 w-12 text-neutral-300" />
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Page Not Found</h1>
        <p className="mt-1 text-sm text-neutral-500">
          The page you're looking for doesn't exist or you don't have access to it.
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
