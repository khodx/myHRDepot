import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { MhdCard } from '@/components/ui/MhdCard';
import { MhdTable, MhdTd, MhdTh, MhdTr } from '@/components/ui/MhdTable';
import {
  useMhdCreateQuote,
  useMhdDeleteQuote,
  useMhdQuotes,
  useMhdUpdateQuote,
} from '@/features/quotes/Hook';
import { mhdQuoteSchema } from '@/features/quotes/Schemas';
import type { MhdQuote } from '@/features/quotes/Types';

type MhdQuoteFormValues = z.infer<typeof mhdQuoteSchema>;

const EMPTY_QUOTE_FORM: MhdQuoteFormValues = {
  quoteText: '',
  author: '',
  isActive: true,
};

function mhdQuoteDeleteLabel(quoteText: string) {
  const words = quoteText.trim().split(/\s+/).slice(0, 8).join(' ');

  return words.length < quoteText.trim().length ? `${words}...` : words;
}

function mhdQuoteToFormValues(quote: MhdQuote): MhdQuoteFormValues {
  return {
    quoteText: quote.quoteText,
    author: quote.author,
    isActive: quote.isActive,
  };
}

export function MhdAdminQuotesSection() {
  const quotesQuery = useMhdQuotes();
  const createQuoteMutation = useMhdCreateQuote();
  const updateQuoteMutation = useMhdUpdateQuote();
  const deleteQuoteMutation = useMhdDeleteQuote();
  const [selectedQuote, setSelectedQuote] = useState<MhdQuote | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<MhdQuoteFormValues>({
    defaultValues: EMPTY_QUOTE_FORM,
    resolver: zodResolver(mhdQuoteSchema),
  });

  const quotes = quotesQuery.data ?? [];
  const isSaving = createQuoteMutation.isPending || updateQuoteMutation.isPending;

  const openCreateEditor = () => {
    setSelectedQuote(null);
    reset(EMPTY_QUOTE_FORM);
    setIsEditorOpen(true);
  };

  const openEditEditor = (quote: MhdQuote) => {
    setSelectedQuote(quote);
    reset(mhdQuoteToFormValues(quote));
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setSelectedQuote(null);
    reset(EMPTY_QUOTE_FORM);
    setIsEditorOpen(false);
  };

  const handleSave = handleSubmit(async (values) => {
    if (selectedQuote) {
      await updateQuoteMutation.mutateAsync({
        quoteId: selectedQuote.id,
        quoteText: values.quoteText,
        author: values.author ?? null,
        isActive: values.isActive,
      });
    } else {
      await createQuoteMutation.mutateAsync(values);
    }

    closeEditor();
  });

  const handleToggleActive = async (quote: MhdQuote) => {
    await updateQuoteMutation.mutateAsync({
      quoteId: quote.id,
      quoteText: quote.quoteText,
      author: quote.author,
      isActive: !quote.isActive,
    });
  };

  const handleDelete = async (quote: MhdQuote) => {
    if (
      window.confirm(
        `Delete quote "${mhdQuoteDeleteLabel(quote.quoteText)}"? This cannot be undone.`,
      )
    ) {
      await deleteQuoteMutation.mutateAsync(quote.id);

      if (selectedQuote?.id === quote.id) {
        closeEditor();
      }
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Greeting card quotes</h2>
          <p className="text-sm text-muted-foreground">
            Manage the quote pool shown on dashboard greeting cards.
          </p>
        </div>
        <Button type="button" onClick={openCreateEditor}>
          New quote
        </Button>
      </div>

      {quotesQuery.isError ? <p className="text-sm text-rose-600">Unable to load quotes.</p> : null}

      <MhdCard className="overflow-hidden">
        <MhdTable>
          <thead>
            <tr>
              <MhdTh>Quote</MhdTh>
              <MhdTh>Author</MhdTh>
              <MhdTh>Source citation</MhdTh>
              <MhdTh>Status</MhdTh>
              <MhdTh>Actions</MhdTh>
            </tr>
          </thead>
          <tbody>
            {quotesQuery.isLoading ? (
              <MhdTr>
                <MhdTd colSpan={5}>Loading quotes...</MhdTd>
              </MhdTr>
            ) : quotes.length === 0 ? (
              <MhdTr>
                <MhdTd colSpan={5}>No quotes have been created yet.</MhdTd>
              </MhdTr>
            ) : (
              quotes.map((quote) => (
                <MhdTr key={quote.id}>
                  <MhdTd className="max-w-xl whitespace-normal break-words">
                    {quote.quoteText}
                  </MhdTd>
                  <MhdTd>{quote.author}</MhdTd>
                  <MhdTd>{quote.sourceCitation || '—'}</MhdTd>
                  <MhdTd>{quote.isActive ? 'Active' : 'Inactive'}</MhdTd>
                  <MhdTd>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => openEditEditor(quote)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={updateQuoteMutation.isPending}
                        onClick={() => handleToggleActive(quote)}
                      >
                        {quote.isActive ? 'Deactivate' : 'Reactivate'}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={deleteQuoteMutation.isPending}
                        onClick={() => handleDelete(quote)}
                      >
                        Delete
                      </Button>
                    </div>
                  </MhdTd>
                </MhdTr>
              ))
            )}
          </tbody>
        </MhdTable>
      </MhdCard>

      {updateQuoteMutation.isError ? (
        <p className="text-sm text-rose-600">Unable to update quote.</p>
      ) : null}
      {deleteQuoteMutation.isError ? (
        <p className="text-sm text-rose-600">Unable to delete quote.</p>
      ) : null}

      {isEditorOpen ? (
        <MhdCard className="space-y-4 p-4">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {selectedQuote ? 'Edit quote' : 'New quote'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedQuote ? 'Update the selected dashboard quote.' : 'Add a dashboard quote.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSave}>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground" htmlFor="quoteText">
                Quote text
              </label>
              <textarea
                id="quoteText"
                className="min-h-28 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                {...register('quoteText')}
              />
              {errors.quoteText?.message ? (
                <p className="text-sm text-rose-600">{errors.quoteText.message}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground" htmlFor="author">
                  Author
                </label>
                <input
                  id="author"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  {...register('author')}
                />
                {errors.author?.message ? (
                  <p className="text-sm text-rose-600">{errors.author.message}</p>
                ) : null}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" className="h-4 w-4" {...register('isActive')} />
              Active
            </label>
            {errors.isActive?.message ? (
              <p className="text-sm text-rose-600">{errors.isActive.message}</p>
            ) : null}

            {createQuoteMutation.isError ? (
              <p className="text-sm text-rose-600">Unable to create quote.</p>
            ) : null}
            {updateQuoteMutation.isError ? (
              <p className="text-sm text-rose-600">Unable to save quote.</p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isSaving}>
                {selectedQuote ? 'Save quote' : 'Create quote'}
              </Button>
              <Button type="button" variant="secondary" onClick={closeEditor}>
                Cancel
              </Button>
            </div>
          </form>
        </MhdCard>
      ) : null}
    </section>
  );
}
