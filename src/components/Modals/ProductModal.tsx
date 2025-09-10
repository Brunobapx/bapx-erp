import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductModalTabs } from "./ProductModal/ProductModalTabs";
import { useCompanyFiscalSettings } from "@/hooks/useCompanyFiscalSettings";

interface ProductModalProps {
  isOpen: boolean;
  onClose: (refresh?: boolean) => void;
  productData: any | null;
}

export const ProductModal = ({ isOpen, onClose, productData }: ProductModalProps) => {
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    name: '',
    sku: '',
    ncm: '',
    cest: '',
    cst_csosn: '101',
    price: '',
    cost: '',
    stock: '',
    weight: '',
    unit: 'UN',
    category: '',
    description: '',
    tax_type: 'Tributado',
    icms: '18',
    ipi: '5',
    pis: '1.65',
    cofins: '7.6',
    is_manufactured: false,
    is_direct_sale: false,
    is_active: true
  });

  const [recipeItems, setRecipeItems] = useState<Array<{id: string, productId: string, quantity: string}>>([]);
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings: fiscalSettings } = useCompanyFiscalSettings();
  
  const isNewProduct = !productData?.id;
  
  useEffect(() => {
    if (productData) {
      setFormData({
        id: productData.id || '',
        code: productData.code || '',
        name: productData.name || '',
        sku: productData.sku || '',
        ncm: productData.ncm || fiscalSettings.default_ncm,
        cest: productData.cest || '',
        cst_csosn: productData.cst_csosn || fiscalSettings.csosn_padrao || '101',
        price: productData.price ? productData.price.toString() : '',
        cost: productData.cost ? productData.cost.toString() : '',
        stock: productData.stock ? productData.stock.toString() : '',
        weight: productData.weight ? productData.weight.toString() : '',
        unit: productData.unit || 'UN',
        category: productData.category || '',
        description: productData.description || '',
        tax_type: productData.tax_type || 'Tributado',
        icms: productData.icms || fiscalSettings.icms_percentual?.toString() || '18',
        ipi: productData.ipi || '5',
        pis: productData.pis || fiscalSettings.pis_aliquota?.toString() || '1.65',
        cofins: productData.cofins || fiscalSettings.cofins_aliquota?.toString() || '7.6',
        is_manufactured: productData.is_manufactured || false,
        is_direct_sale: productData.is_direct_sale || false,
        is_active: productData.is_active !== undefined ? productData.is_active : true
      });
      
      // Carregar receita existente se for produto fabricado
      if (productData.is_manufactured && productData.id) {
        fetchProductRecipe(productData.id);
      }
    } else {
      resetForm();
    }
    
    fetchIngredients();
    fetchCategories();
  }, [productData]);

  const fetchProductRecipe = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_recipes')
        .select('*')
        .eq('product_id', productId);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const recipeData = data.map(item => ({
          id: item.id,
          productId: item.ingredient_id,
          quantity: item.quantity.toString()
        }));
        setRecipeItems(recipeData);
      }
    } catch (err: any) {
      console.error('Error fetching recipe:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
        
      if (error) throw error;
      
      if (data) {
        setCategories(data);
      }
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchIngredients = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated');
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, name, unit, cost')
        .eq('user_id', user.id)
        .eq('is_manufactured', false);
        
      if (error) throw error;
      
      if (data) {
        setAvailableIngredients(data);
      }
    } catch (err: any) {
      console.error('Error fetching ingredients:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      code: '',
      name: '',
      sku: '',
      ncm: fiscalSettings.default_ncm,
      cest: '',
      cst_csosn: fiscalSettings.csosn_padrao || '101',
      price: '',
      cost: '',
      stock: '',
      weight: '',
      unit: 'UN',
      category: '',
      description: '',
      tax_type: 'Tributado',
      icms: '18',
      ipi: '5',
      pis: fiscalSettings.pis_aliquota?.toString() || '1.65',
      cofins: fiscalSettings.cofins_aliquota?.toString() || '7.6',
      is_manufactured: false,
      is_direct_sale: false,
      is_active: true
    });
    setRecipeItems([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => {
      if (name === 'is_manufactured' && checked) {
        return { ...prev, is_manufactured: true, is_direct_sale: false };
      }
      if (name === 'is_direct_sale' && checked) {
        return { ...prev, is_direct_sale: true, is_manufactured: false };
      }
      return { ...prev, [name]: checked };
    });
    if (name === 'is_manufactured' && checked) {
      setIsRecipeOpen(true);
    }
    if (name === 'is_manufactured' && !checked) {
      setIsRecipeOpen(false);
    }
  };

  const handleRecipeItemChange = (index: number, field: string, value: string) => {
    const updatedItems = [...recipeItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setRecipeItems(updatedItems);
  };

  const addRecipeItem = () => {
    setRecipeItems([...recipeItems, { id: Date.now().toString(), productId: '', quantity: '1' }]);
  };

  const removeRecipeItem = (index: number) => {
    const updatedItems = [...recipeItems];
    updatedItems.splice(index, 1);
    setRecipeItems(updatedItems);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nome do produto é obrigatório');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const productPayload = {
        user_id: user.id,
        code: formData.code,
        name: formData.name,
        sku: formData.sku,
        ncm: formData.ncm,
        cest: formData.cest,
        cst_csosn: formData.cst_csosn,
        price: formData.price ? parseFloat(formData.price) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        stock: formData.stock ? parseFloat(formData.stock) : 0,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        unit: formData.unit,
        category: formData.category,
        description: formData.description,
        tax_type: formData.tax_type,
        icms: formData.icms,
        ipi: formData.ipi,
        pis: formData.pis,
        cofins: formData.cofins,
        is_manufactured: formData.is_manufactured,
        is_direct_sale: formData.is_direct_sale,
        is_active: formData.is_active
      };
      
      let productId;
      
      if (isNewProduct) {
        const { data, error } = await supabase
          .from('products')
          .insert([productPayload])
          .select();
          
        if (error) throw error;
        if (data && data.length > 0) {
          productId = data[0].id;
          toast.success('Produto adicionado com sucesso');
        }
      } else {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', formData.id);
          
        if (error) throw error;
        productId = formData.id;
        toast.success('Produto atualizado com sucesso');
      }
      
      // Gerenciar receitas para produtos fabricados
      if (formData.is_manufactured && productId) {
        // Primeiro deletar receitas existentes
        const { error: deleteError } = await supabase
          .from('product_recipes')
          .delete()
          .eq('product_id', productId);
          
        if (deleteError) {
          console.error('Error deleting existing recipes:', deleteError);
        }
        
        // Inserir novas receitas se houver ingredientes
        if (recipeItems.length > 0) {
          const validRecipeItems = recipeItems.filter(item => 
            item.productId && item.quantity && parseFloat(item.quantity) > 0
          );
          
          if (validRecipeItems.length > 0) {
            const recipePayload = validRecipeItems.map(item => ({
              user_id: user.id,
              product_id: productId,
              ingredient_id: item.productId,
              quantity: parseFloat(item.quantity)
            }));
            
            const { error: insertError } = await supabase
              .from('product_recipes')
              .insert(recipePayload);
              
            if (insertError) {
              console.error('Error saving recipe:', insertError);
              toast.error('Erro ao salvar receita do produto');
            } else {
              console.log('Receita salva com sucesso');
            }
          }
        }
      }
      
      onClose(true);
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(`Erro ao ${isNewProduct ? 'adicionar' : 'atualizar'} produto: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const unitOptions = [
    { value: 'UN', label: 'Unidade' },
    { value: 'PC', label: 'Peça' },
    { value: 'KG', label: 'Quilograma' },
    { value: 'L', label: 'Litro' },
    { value: 'M', label: 'Metro' },
    { value: 'CX', label: 'Caixa' },
    { value: 'G', label: 'Grama' },
    { value: 'PCT', label: 'Pacote' }
  ];

  const taxTypeOptions = [
    { value: 'Tributado', label: 'Tributado' },
    { value: 'Isento', label: 'Isento' },
    { value: 'Substituição', label: 'Substituição Tributária' },
    { value: 'Importação', label: 'Importação' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isNewProduct ? 'Novo Produto' : 'Editar Produto'}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 max-h-[70vh] overflow-y-auto">
          <ProductModalTabs
            formData={formData}
            handleChange={handleChange}
            handleSelectChange={handleSelectChange}
            handleSwitchChange={handleSwitchChange}
            unitOptions={unitOptions}
            categories={categories}
            taxTypeOptions={taxTypeOptions}
            fiscalSettings={fiscalSettings}
            isRecipeOpen={isRecipeOpen}
            setIsRecipeOpen={setIsRecipeOpen}
            recipeItems={recipeItems}
            availableIngredients={availableIngredients}
            handleRecipeItemChange={handleRecipeItemChange}
            addRecipeItem={addRecipeItem}
            removeRecipeItem={removeRecipeItem}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()}>Cancelar</Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-erp-packaging hover:bg-erp-packaging/90"
          >
            {isSubmitting ? 'Salvando...' : isNewProduct ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
