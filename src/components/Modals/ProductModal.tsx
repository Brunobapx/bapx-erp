import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    price: '',
    cost: '',
    stock: '',
    unit: 'UN',
    category: '',
    description: '',
    tax_type: 'Tributado',
    icms: '18',
    ipi: '5',
    pis: '1.65',
    cofins: '7.6',
    is_manufactured: false
  });

  const [recipeItems, setRecipeItems] = useState<Array<{id: string, productId: string, quantity: string}>>([]);
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isNewProduct = !productData?.id;
  
  useEffect(() => {
    if (productData) {
      setFormData({
        id: productData.id || '',
        code: productData.code || '',
        name: productData.name || '',
        sku: productData.sku || '',
        ncm: productData.ncm || '',
        price: productData.price ? productData.price.toString() : '',
        cost: productData.cost ? productData.cost.toString() : '',
        stock: productData.stock ? productData.stock.toString() : '',
        unit: productData.unit || 'UN',
        category: productData.category || '',
        description: productData.description || '',
        tax_type: productData.tax_type || 'Tributado',
        icms: productData.icms || '18',
        ipi: productData.ipi || '5',
        pis: productData.pis || '1.65',
        cofins: productData.cofins || '7.6',
        is_manufactured: productData.is_manufactured || false
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
      ncm: '',
      price: '',
      cost: '',
      stock: '',
      unit: 'UN',
      category: '',
      description: '',
      tax_type: 'Tributado',
      icms: '18',
      ipi: '5',
      pis: '1.65',
      cofins: '7.6',
      is_manufactured: false
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
    setFormData(prev => ({ ...prev, [name]: checked }));
    if (name === 'is_manufactured' && checked) {
      setIsRecipeOpen(true);
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
        price: formData.price ? parseFloat(formData.price) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        stock: formData.stock ? parseFloat(formData.stock) : 0,
        unit: formData.unit,
        category: formData.category,
        description: formData.description,
        tax_type: formData.tax_type,
        icms: formData.icms,
        ipi: formData.ipi,
        pis: formData.pis,
        cofins: formData.cofins,
        is_manufactured: formData.is_manufactured
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
    { value: 'CX', label: 'Caixa' }
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
        
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU/EAN</Label>
              <Input
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Produto</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category}
                onValueChange={(value) => handleSelectChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidade</Label>
              <Select 
                value={formData.unit}
                onValueChange={(value) => handleSelectChange('unit', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {unitOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cost">Custo (R$)</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                value={formData.cost}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Estoque</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleChange}
              />
            </div>
          </div>
          
          {/* Manufacturing Option */}
          <div className="flex items-center space-x-2 pt-2 border-t">
            <Switch
              id="manufacturing"
              checked={formData.is_manufactured}
              onCheckedChange={(checked) => handleSwitchChange('is_manufactured', checked)}
            />
            <Label htmlFor="manufacturing" className="font-medium">Produto Fabricado</Label>
          </div>
          
          {/* Recipe Management */}
          {formData.is_manufactured && (
            <Collapsible open={isRecipeOpen} onOpenChange={setIsRecipeOpen} className="border rounded-md p-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-2 font-medium">
                Receita de Fabricação
                {isRecipeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Adicione os insumos necessários para fabricação deste produto.</p>
                  
                  {recipeItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-[1fr,auto,auto] gap-2 items-end">
                      <div>
                        <Label>Insumo</Label>
                        <Select 
                          value={item.productId}
                          onValueChange={(value) => handleRecipeItemChange(index, 'productId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um insumo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableIngredients.map(ing => (
                              <SelectItem key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Quantidade</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleRecipeItemChange(index, 'quantity', e.target.value)}
                          min="0.01"
                          step="0.01"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRecipeItem(index)}
                        className="mb-0.5"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRecipeItem}
                    className="mt-2 w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Insumo
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Fiscal Information */}
          <div className="border-t pt-4 mt-2">
            <h4 className="text-sm font-medium mb-2">Informações Fiscais</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ncm">NCM</Label>
                <Input
                  id="ncm"
                  name="ncm"
                  value={formData.ncm}
                  onChange={handleChange}
                  placeholder="0000.00.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tax_type">Tipo Tributário</Label>
                <Select 
                  value={formData.tax_type}
                  onValueChange={(value) => handleSelectChange('tax_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {taxTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="icms">ICMS (%)</Label>
                <Input
                  id="icms"
                  name="icms"
                  value={formData.icms}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ipi">IPI (%)</Label>
                <Input
                  id="ipi"
                  name="ipi"
                  value={formData.ipi}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pis">PIS (%)</Label>
                <Input
                  id="pis"
                  name="pis"
                  value={formData.pis}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cofins">COFINS (%)</Label>
                <Input
                  id="cofins"
                  name="cofins"
                  value={formData.cofins}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
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
