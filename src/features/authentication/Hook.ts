import { useContext } from 'react';
import { MhdAuthContext } from './MhdAuthContext';

export function useMhdAuth() {
  const context = useContext(MhdAuthContext);

  if (!context) {
    throw new Error('useMhdAuth must be used inside MhdAuthProvider.');
  }

  return context;
}
