import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdQuotesService } from './Service';
import type { MhdCreateQuoteInput, MhdUpdateQuoteInput } from './Types';

export const mhdQuotesQueryKeys = {
  all: ['mhd-quotes'] as const,
  ofTheDay: () => [...mhdQuotesQueryKeys.all, 'of-the-day'] as const,
  list: () => [...mhdQuotesQueryKeys.all, 'list'] as const,
};

/**
 * The dashboard's quote pick is deterministic per calendar day at the
 * database layer (mhd_dashboard_quote_of_the_day), so it never changes
 * mid-session. A long staleTime just avoids redundant refetches within the
 * same day; react-query's default refetch-on-window-focus still picks up a
 * new day's quote whenever the user returns to the tab after midnight.
 */
export function useMhdQuoteOfTheDay() {
  return useQuery({
    queryKey: mhdQuotesQueryKeys.ofTheDay(),
    queryFn: () => mhdQuotesService.getQuoteOfTheDay(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useMhdQuotes() {
  return useQuery({
    queryKey: mhdQuotesQueryKeys.list(),
    queryFn: () => mhdQuotesService.listQuotes(),
  });
}

export function useMhdCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MhdCreateQuoteInput) => mhdQuotesService.createQuote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mhdQuotesQueryKeys.all });
    },
  });
}

export function useMhdUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MhdUpdateQuoteInput) => mhdQuotesService.updateQuote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mhdQuotesQueryKeys.all });
    },
  });
}

export function useMhdDeleteQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) => mhdQuotesService.deleteQuote(quoteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mhdQuotesQueryKeys.all });
    },
  });
}
