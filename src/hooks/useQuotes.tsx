import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface QuoteItem {
  id: string;
  product_id: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  valid_until: string;
  payment_method?: string;
  payment_term?: string;
  notes?: string;
  discount_percentage?: number;
  discount_amount?: number;
  subtotal: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  company_id: string;
  items: QuoteItem[];
}

async function fetchQuotes() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Usuário não autenticado');
  }

  const { data, error } = await supabase
    .from('quotes')
    .select(`
      *,
      quote_items (
        id,
        product_id,
        product_name,
        description,
        quantity,
        unit_price,
        total_price
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(quote => ({
    ...quote,
    items: quote.quote_items || []
  })) as Quote[];
}

export const useQuotes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const {
    data: allQuotes = [],
    isLoading,
    error,
    refetch
  } = useQuery<Quote[], Error>({
    queryKey: ['quotes'],
    queryFn: fetchQuotes,
    staleTime: 1000 * 60 * 5,
    meta: {
      onError: (err: Error) => {
        if (!err.message.includes('não autenticado')) {
          toast.error('Erro ao carregar orçamentos: ' + (err.message || 'Erro desconhecido'));
        }
      },
    },
  });

  const refreshQuotes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['quotes'] });
  }, [queryClient]);

  const searchQuotes = useCallback((searchTerm: string) => {
    if (!searchTerm?.trim()) return allQuotes;
    const searchString = searchTerm.toLowerCase();
    return allQuotes.filter(quote => {
      return (
        (quote.quote_number && quote.quote_number.toLowerCase().includes(searchString)) ||
        (quote.client_name && quote.client_name.toLowerCase().includes(searchString)) ||
        (quote.client_email && quote.client_email.toLowerCase().includes(searchString))
      );
    });
  }, [allQuotes]);

  const filteredQuotes = searchQuotes(searchQuery);

  const createQuote = async (quoteData: Omit<Quote, 'id' | 'quote_number' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Usuário não autenticado');

      // Generate quote number
      const { data: lastQuote } = await supabase
        .from('quotes')
        .select('quote_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastQuote?.quote_number) {
        const currentNumber = parseInt(lastQuote.quote_number.replace(/\D/g, ''));
        nextNumber = currentNumber + 1;
      }
      
      const quoteNumber = `ORC-${nextNumber.toString().padStart(6, '0')}`;

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert([{
          ...quoteData,
          quote_number: quoteNumber,
          user_id: user.id
        }])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Insert quote items
      if (quoteData.items && quoteData.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(
            quoteData.items.map(item => ({
              ...item,
              quote_id: quote.id,
              user_id: user.id
            }))
          );

        if (itemsError) throw itemsError;
      }

      await refreshQuotes();
      toast.success('Orçamento criado com sucesso!');
      return quote;
    } catch (err: any) {
      toast.error('Erro ao criar orçamento: ' + (err.message || 'Erro desconhecido'));
      throw err;
    }
  };

  const updateQuote = async (id: string, quoteData: Partial<Quote>) => {
    try {
      const { items, ...updateData } = quoteData;
      
      const { error: quoteError } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', id);

      if (quoteError) throw quoteError;

      // Update items if provided
      if (items) {
        // Delete existing items
        await supabase
          .from('quote_items')
          .delete()
          .eq('quote_id', id);

        // Insert new items
        if (items.length > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          const { error: itemsError } = await supabase
            .from('quote_items')
            .insert(
              items.map(item => ({
                ...item,
                quote_id: id,
                user_id: user!.id
              }))
            );

          if (itemsError) throw itemsError;
        }
      }

      await refreshQuotes();
      toast.success('Orçamento atualizado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao atualizar orçamento: ' + (err.message || 'Erro desconhecido'));
      throw err;
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      // Delete items first (foreign key constraint)
      await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', id);

      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await refreshQuotes();
      toast.success('Orçamento excluído com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao excluir orçamento: ' + (err.message || 'Erro desconhecido'));
      throw err;
    }
  };

  return {
    quotes: filteredQuotes,
    allQuotes,
    isLoading,
    error: error ? error.message : null,
    searchQuery,
    setSearchQuery,
    refreshQuotes,
    searchQuotes,
    refetch,
    createQuote,
    updateQuote,
    deleteQuote,
  };
};