import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMhdAuth } from '../Hook';

export function MhdAuthCallbackPage() {
  const navigate = useNavigate();
  const { refreshProfile } = useMhdAuth();

  useEffect(() => {
    refreshProfile()
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login', { replace: true }));
  }, [navigate, refreshProfile]);

  return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Completing sign in...</div>;
}
