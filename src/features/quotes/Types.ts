export interface MhdQuote {
  id: string;
  quoteText: string;
  author: string | null;
  sourceCitation: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MhdCreateQuoteInput {
  quoteText: string;
  author?: string | null;
  isActive?: boolean;
}

export interface MhdUpdateQuoteInput {
  quoteId: string;
  quoteText: string;
  author: string | null;
  isActive: boolean;
}
