export interface MhdAssistantMatch {
  label: string;
  description: string;
  route: string;
  score: number;
}

export interface MhdAssistantCandidate {
  label: string;
  description: string;
  route: string;
  keywords?: string[];
}
