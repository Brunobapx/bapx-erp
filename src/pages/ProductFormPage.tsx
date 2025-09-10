import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProductModalTabs } from "@/components/Modals/ProductModal/ProductModalTabs";
import { useCompanyFiscalSettings } from "@/hooks/useCompanyFiscalSettings";
import { ArrowLeft } from 'lucide-react';

export const ProductFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
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
    gross_weight: '',
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
  const [loading, setLoading] = useState(false);
  const { settings: fiscalSettings } = useCompanyFiscalSettings();

  useEffect(() => {
    fetchCategories();
    fetchIngredients();
    
    if (isEditMode && id) {
      loadProduct(id);
    } else {
      resetForm();
    }
  }, [id, isEditMode, fiscalSettings]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id || '',
          code: data.code || '',
          name: data.name || '',
          sku: data.sku || '',
          ncm: data.ncm || fiscalSettings.default_ncm,
          cest: data.cest || '',
          cst_csosn: data.cst_csosn || fiscalSettings.csosn_padrao || '101',
          price: data.price ? data.price.toString() : '',
          cost: data.cost ? data.cost.toString() : '',
          stock: data.stock ? data.stock.toString() : '',
          weight: data.weight ? data.weight.toString() : '',
          gross_weight: data.gross_weight ? data.gross_weight.toString() : '',
          unit: data.unit || 'UN',
          category: data.category || '',
          description: data.description || '',
          tax_type: data.tax_type || 'Tributado',
          icms: data.icms || fiscalSettings.icms_percentual?.toString() || '18',
          ipi: data.ipi || '5',
          pis: data.pis || fiscalSettings.pis_aliquota?.toString() || '1.65',
          cofins: data.cofins || fiscalSettings.cofins_aliquota?.toString() || '7.6',
          is_manufactured: data.is_manufactured || false,
          is_direct_sale: data.is_direct_sale || false,
          is_active: data.is_active !== undefined ? data.is_active : true
        });
        
        // Carregar receita se for produto fabricado
        if (data.is_manufactured) {
          fetchProductRecipe(productId);
        }
      }
    } catch (err: any) {
      console.error('Error loading product:', err);
      toast.error('Erro ao carregar produto: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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
        setIsRecipeOpen(true);
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
      gross_weight: '',
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
        gross_weight: formData.gross_weight ? parseFloat(formData.gross_weight) : null,
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
      
      if (!isEditMode) {
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
            }
          }
        }
      }
      
      navigate('/produtos');
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(`Erro ao ${isEditMode ? 'atualizar' : 'adicionar'} produto: ${error.message}`);
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

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/produtos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Atualize as informações do produto' : 'Cadastre um novo produto no sistema'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditMode ? `Editando: ${formData.name}` : 'Informações do Produto'}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/produtos')}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Criar Produto'}
        </Button>
      </div>
    </div>
  );
};

export default ProductFormPage;