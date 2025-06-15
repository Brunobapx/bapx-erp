
import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecipeItem {
  id: string;
  productId: string;
  quantity: string;
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
  isVisible, isRecipeOpen, setIsRecipeOpen,
  recipeItems, availableIngredients,
  handleRecipeItemChange, addRecipeItem, removeRecipeItem
}) => {
  if (!isVisible) return null;

  return (
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
                  onValueChange={value => handleRecipeItemChange(index, 'productId', value)}
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
                  onChange={e => handleRecipeItemChange(index, 'quantity', e.target.value)}
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
  );
};
