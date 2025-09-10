import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductBasicFields } from "./ProductBasicFields";
import { ProductPricingFields } from "./ProductPricingFields";
import { ProductTypeSwitches } from "./ProductTypeSwitches";
import { ProductRecipeSection } from "./ProductRecipeSection";
import { ProductFiscalFields } from "./ProductFiscalFields";

interface ProductModalTabsProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleSwitchChange: (name: string, checked: boolean) => void;
  unitOptions: Array<{ value: string, label: string }>;
  categories: any[];
  taxTypeOptions: Array<{ value: string, label: string }>;
  fiscalSettings?: any;
  // Recipe props
  isRecipeOpen: boolean;
  setIsRecipeOpen: (open: boolean) => void;
  recipeItems: Array<{id: string, productId: string, quantity: string}>;
  availableIngredients: any[];
  handleRecipeItemChange: (index: number, field: string, value: string) => void;
  addRecipeItem: () => void;
  removeRecipeItem: (index: number) => void;
}

export const ProductModalTabs: React.FC<ProductModalTabsProps> = ({
  formData,
  handleChange,
  handleSelectChange,
  handleSwitchChange,
  unitOptions,
  categories,
  taxTypeOptions,
  fiscalSettings,
  isRecipeOpen,
  setIsRecipeOpen,
  recipeItems,
  availableIngredients,
  handleRecipeItemChange,
  addRecipeItem,
  removeRecipeItem
}) => {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className={`grid w-full ${formData.is_manufactured ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
        <TabsTrigger value="pricing">Preços & Estoque</TabsTrigger>
        <TabsTrigger value="fiscal">Dados Fiscais</TabsTrigger>
        {formData.is_manufactured && (
          <TabsTrigger value="recipe">Receita</TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="basic" className="space-y-4 mt-4">
        <ProductBasicFields
          formData={formData}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          handleSwitchChange={handleSwitchChange}
          unitOptions={unitOptions}
          categories={categories}
        />
        
        <ProductTypeSwitches
          is_direct_sale={formData.is_direct_sale}
          is_manufactured={formData.is_manufactured}
          handleSwitchChange={handleSwitchChange}
        />
      </TabsContent>
      
      <TabsContent value="pricing" className="space-y-4 mt-4">
        <ProductPricingFields
          formData={formData}
          handleChange={handleChange}
        />
      </TabsContent>
      
      <TabsContent value="fiscal" className="space-y-4 mt-4">
        <ProductFiscalFields
          formData={formData}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          taxTypeOptions={taxTypeOptions}
          fiscalSettings={fiscalSettings}
        />
      </TabsContent>
      
      {formData.is_manufactured && (
        <TabsContent value="recipe" className="space-y-4 mt-4">
          <ProductRecipeSection
            isVisible={true}
            isRecipeOpen={isRecipeOpen}
            setIsRecipeOpen={setIsRecipeOpen}
            recipeItems={recipeItems}
            availableIngredients={availableIngredients}
            handleRecipeItemChange={handleRecipeItemChange}
            addRecipeItem={addRecipeItem}
            removeRecipeItem={removeRecipeItem}
          />
        </TabsContent>
      )}
    </Tabs>
  );
};