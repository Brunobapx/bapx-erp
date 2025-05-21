
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
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
    taxType: 'Tributado',
    icms: '18',
    ipi: '5',
    pis: '1.65',
    cofins: '7.6',
    isManufactured: false
  });

  const [recipeItems, setRecipeItems] = useState<Array<{id: string, productId: string, quantity: string}>>([]);
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [availableIngredients, setAvailableIngredients] = useState<any[]>([]);
  
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
        taxType: productData.taxType || 'Tributado',
        icms: productData.icms || '18',
        ipi: productData.ipi || '5',
        pis: productData.pis || '1.65',
        cofins: productData.cofins || '7.6',
        isManufactured: productData.isManufactured || false
      });
      
      if (productData.recipe) {
        setRecipeItems(productData.recipe);
      }
    } else {
      resetForm();
    }
    
    // Mock data for available ingredients
    setAvailableIngredients([
      { id: '1', name: 'Matéria prima A', unit: 'KG', cost: 25.00 },
      { id: '2', name: 'Componente eletrônico B', unit: 'UN', cost: 8.50 },
      { id: '3', name: 'Material C', unit: 'M', cost: 12.75 },
      { id: '4', name: 'Insumo químico D', unit: 'L', cost: 30.20 },
      { id: '5', name: 'Composto E', unit: 'G', cost: 5.60 },
    ]);
  }, [productData]);

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
      taxType: 'Tributado',
      icms: '18',
      ipi: '5',
      pis: '1.65',
      cofins: '7.6',
      isManufactured: false
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
    if (name === 'isManufactured' && checked) {
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

  const handleSubmit = () => {
    // Here we would submit to backend API
    // For now just show a toast notification
    toast({
      title: isNewProduct ? "Produto adicionado" : "Produto atualizado",
      description: `${formData.name} foi ${isNewProduct ? 'adicionado' : 'atualizado'} com sucesso.`,
    });
    onClose();
  };

  const unitOptions = [
    { value: 'UN', label: 'Unidade' },
    { value: 'PC', label: 'Peça' },
    { value: 'KG', label: 'Quilograma' },
    { value: 'L', label: 'Litro' },
    { value: 'M', label: 'Metro' },
    { value: 'CX', label: 'Caixa' }
  ];

  const categoryOptions = [
    { value: 'Eletrônicos', label: 'Eletrônicos' },
    { value: 'Energia', label: 'Energia' },
    { value: 'Médico', label: 'Médico' },
    { value: 'Embalagens', label: 'Embalagens' },
    { value: 'Insumos', label: 'Insumos' }
  ];

  const taxTypeOptions = [
    { value: 'Tributado', label: 'Tributado' },
    { value: 'Isento', label: 'Isento' },
    { value: 'Substituição', label: 'Substituição Tributária' },
    { value: 'Importação', label: 'Importação' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
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
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
              checked={formData.isManufactured}
              onCheckedChange={(checked) => handleSwitchChange('isManufactured', checked)}
            />
            <Label htmlFor="manufacturing" className="font-medium">Produto Fabricado</Label>
          </div>
          
          {/* Recipe Management */}
          {formData.isManufactured && (
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
                <Label htmlFor="taxType">Tipo Tributário</Label>
                <Select 
                  value={formData.taxType}
                  onValueChange={(value) => handleSelectChange('taxType', value)}
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
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit}
            className="bg-erp-packaging hover:bg-erp-packaging/90"
          >
            {isNewProduct ? 'Adicionar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
