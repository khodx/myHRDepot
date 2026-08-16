import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mhdQuotesService } from './Service';
import type { MhdCreateQuoteInput, MhdUpdateQuoteInput } from './Types';

export const mhdQuotesQueryKeys = {
  all: ['mhd-quotes'] as const,
  random: () => [...mhdQuotesQueryKeys.all, 'random'] as const,
  list: () => [...mhdQuotesQueryKeys.all, 'list'] as const,
};

export function useMhdRandomQuote() {
  return useQuery({
    queryKey: mhdQuotesQueryKeys.random(),
    queryFn: () => mhdQuotesService.getRandomQuote(),
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
