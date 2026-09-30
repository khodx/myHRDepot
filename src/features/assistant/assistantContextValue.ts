import { createContext, useContext } from 'react';

export interface MhdAssistantContextValue {
  openAssistant: (initialQuery?: string) => void;
}

export const MhdAssistantContext = createContext<MhdAssistantContextValue | null>(null);

export function useMhdAssistant(): MhdAssistantContextValue {
  const context = useContext(MhdAssistantContext);

  if (!context) {
    throw new Error('useMhdAssistant must be used within a MhdAssistantProvider');
  }

  return context;
}
