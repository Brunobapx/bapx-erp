
import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RecipeItem {
  id: string;
  productId: string;
  quantity: string;
  unitCost: string;
}

interface ProductRecipeSectionProps {
  isVisible: boolean;
  isRecipeOpen: boolean;
  setIsRecipeOpen: (v: boolean) => void;
  recipeItems: RecipeItem[];
  availableIngredients: any[];
  handleRecipeItemChange: (index: number, field: string, value: string) => void;
  addRecipeItem: () => void;
  removeRecipeItem: (index: number) => void;
}

export const ProductRecipeSection: React.FC<ProductRecipeSectionProps> = ({
  isVisible,
  recipeItems,
  availableIngredients,
  handleRecipeItemChange,
  addRecipeItem,
  removeRecipeItem
}) => {
  if (!isVisible) return null;

  const calculateItemTotal = (quantity: string, unitCost: string) => {
    const qty = parseFloat(quantity) || 0;
    const cost = parseFloat(unitCost) || 0;
    return qty * cost;
  };

  const calculateTotalCost = () => {
    return recipeItems.reduce((total, item) => {
      return total + calculateItemTotal(item.quantity, item.unitCost);
    }, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Receita do Produto</CardTitle>
          <CardDescription>
            Defina os insumos e embalagens necessários para fabricar este produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Itens da Receita</h3>
              <Button
                type="button"
                onClick={addRecipeItem}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>

            {recipeItems.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo/Embalagem</TableHead>
                      <TableHead className="w-32">Quantidade</TableHead>
                      <TableHead className="w-32">Custo Unit. (R$)</TableHead>
                      <TableHead className="w-32">Total (R$)</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipeItems.map((item, index) => {
                      const selectedIngredient = availableIngredients.find(ing => ing.id === item.productId);
                      const itemTotal = calculateItemTotal(item.quantity, item.unitCost);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select
                              value={item.productId}
                              onValueChange={value => handleRecipeItemChange(index, 'productId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um insumo..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIngredients.map(ing => (
                                  <SelectItem key={ing.id} value={ing.id}>
                                    {ing.code || ing.name} - {ing.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={e => handleRecipeItemChange(index, 'quantity', e.target.value)}
                              min="0.01"
                              step="0.01"
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitCost}
                              onChange={e => handleRecipeItemChange(index, 'unitCost', e.target.value)}
                              min="0.01"
                              step="0.01"
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatCurrency(itemTotal)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRecipeItem(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <p className="text-muted-foreground">Nenhum item adicionado à receita</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em "Adicionar Item" para começar
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="secondary"
                className="bg-secondary hover:bg-secondary/80"
              >
                Salvar Receita
              </Button>
              <div className="text-lg font-semibold">
                Custo Total: {formatCurrency(calculateTotalCost())}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
