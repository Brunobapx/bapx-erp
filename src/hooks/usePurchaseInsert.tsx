
import { useState } from 'react';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCompanies } from "./useCompanies";

export type PurchaseFormData = {
  vendor_id?: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  invoice_key?: string;
  xml_content?: string;
  total_amount: number;
  notes?: string;
  items: Array<{
    product_id?: string;
    product_code?: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    unit?: string;
    ncm?: string;
  }>;
};

export const usePurchaseInsert = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getUserCompanyId } = useCompanies();

  const createPurchase = async (purchaseData: PurchaseFormData) => {
    setIsSubmitting(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const companyId = await getUserCompanyId();
      if (!companyId) {
        throw new Error('Company ID não encontrado');
      }

      // Criar a compra
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          company_id: companyId,
          vendor_id: purchaseData.vendor_id,
          vendor_name: purchaseData.vendor_name,
          invoice_number: purchaseData.invoice_number,
          invoice_date: purchaseData.invoice_date,
          invoice_key: purchaseData.invoice_key,
          xml_content: purchaseData.xml_content,
          total_amount: purchaseData.total_amount,
          notes: purchaseData.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Criar os itens da compra
      const purchaseItems = purchaseData.items.map(item => ({
        user_id: user.id,
        company_id: companyId,
        purchase_id: purchase.id,
        product_id: item.product_id,
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        unit: item.unit || 'UN',
        ncm: item.ncm
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      toast.success('Compra criada com sucesso!');
      return purchase.id;
      
    } catch (error: any) {
      console.error('Erro ao criar compra:', error);
      toast.error('Erro ao criar compra: ' + (error.message || 'Erro desconhecido'));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createPurchase,
    isSubmitting
  };
};
