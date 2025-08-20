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
    items: (quote as any).quote_items || []
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

      const { items, ...quoteWithoutItems } = quoteData;

      // Remove undefined/null values and ensure required fields
      const cleanQuoteData = {
        client_id: quoteWithoutItems.client_id,
        client_name: quoteWithoutItems.client_name,
        client_email: quoteWithoutItems.client_email || null,
        client_phone: quoteWithoutItems.client_phone || null,
        status: quoteWithoutItems.status || 'draft',
        valid_until: quoteWithoutItems.valid_until,
        payment_method: quoteWithoutItems.payment_method || null,
        payment_term: quoteWithoutItems.payment_term || null,
        notes: quoteWithoutItems.notes || null,
        discount_percentage: quoteWithoutItems.discount_percentage || 0,
        discount_amount: quoteWithoutItems.discount_amount || 0,
        subtotal: quoteWithoutItems.subtotal || 0,
        total_amount: quoteWithoutItems.total_amount || 0,
        user_id: user.id
      };

      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert([cleanQuoteData])
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Insert quote items
      if (items && items.length > 0) {
        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(
            items.map(item => ({
              quote_id: quote.id,
              product_id: item.product_id,
              product_name: item.product_name,
              description: item.description || null,
              quantity: item.quantity,
              unit_price: item.unit_price,
              total_price: item.total_price,
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