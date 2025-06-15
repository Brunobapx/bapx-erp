
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ProductTypeSwitchesProps {
  is_direct_sale: boolean;
  is_manufactured: boolean;
  handleSwitchChange: (name: string, checked: boolean) => void;
}

export const ProductTypeSwitches: React.FC<ProductTypeSwitchesProps> = ({
  is_direct_sale,
  is_manufactured,
  handleSwitchChange
}) => (
  <div className="flex gap-4 items-center space-x-4 pt-2 border-t">
    <div className="flex items-center space-x-2">
      <Switch
        id="directSale"
        checked={is_direct_sale}
        onCheckedChange={(checked) => handleSwitchChange('is_direct_sale', checked)}
        disabled={is_manufactured}
      />
      <Label htmlFor="directSale" className="font-medium">Venda Direta</Label>
    </div>
    <div className="flex items-center space-x-2">
      <Switch
        id="manufacturing"
        checked={is_manufactured}
        onCheckedChange={(checked) => handleSwitchChange('is_manufactured', checked)}
        disabled={is_direct_sale}
      />
      <Label htmlFor="manufacturing" className="font-medium">Produto Fabricado</Label>
    </div>
  </div>
);
