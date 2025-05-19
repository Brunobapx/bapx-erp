
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Palette, Upload, Save, Image } from "lucide-react";

const colorOptions = [
  { name: 'Azul (Padrão)', primary: '#649FFF', secondary: '#9B66FF', accent: '#9b87f5' },
  { name: 'Verde', primary: '#41B883', secondary: '#34495E', accent: '#5ECCAF' },
  { name: 'Vermelho', primary: '#EF4444', secondary: '#991B1B', accent: '#FCA5A5' },
  { name: 'Roxo', primary: '#8B5CF6', secondary: '#6D28D9', accent: '#C4B5FD' },
  { name: 'Amarelo', primary: '#FFC75F', secondary: '#F59E0B', accent: '#FDE68A' },
  { name: 'Personalizado', primary: '', secondary: '', accent: '' }
];

const VisualCustomization = () => {
  const [selectedColorScheme, setSelectedColorScheme] = useState('Azul (Padrão)');
  const [customColors, setCustomColors] = useState({
    primary: '#649FFF',
    secondary: '#9B66FF',
    accent: '#9b87f5'
  });
  const [systemName, setSystemName] = useState('ERP System');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleColorSchemeChange = (schemeName: string) => {
    setSelectedColorScheme(schemeName);
    
    const selectedScheme = colorOptions.find(option => option.name === schemeName);
    if (selectedScheme && schemeName !== 'Personalizado') {
      setCustomColors({
        primary: selectedScheme.primary,
        secondary: selectedScheme.secondary,
        accent: selectedScheme.accent
      });
    }
    
    setHasChanges(true);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCustomColors({
      ...customColors,
      [name]: value
    });
    if (selectedColorScheme !== 'Personalizado') {
      setSelectedColorScheme('Personalizado');
    }
    setHasChanges(true);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
      setHasChanges(true);
    }
  };

  const handleSave = () => {
    // Here would be the API call to save the theme configuration
    toast.success('Customização visual salva com sucesso');
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl">Customização Visual</CardTitle>
            <CardDescription>
              Personalize a aparência do sistema
            </CardDescription>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
          >
            <Save className="mr-2 h-4 w-4" /> Salvar Alterações
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <Label>Esquema de Cores</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {colorOptions.map((option) => (
                  <Button
                    key={option.name}
                    type="button"
                    variant={selectedColorScheme === option.name ? "default" : "outline"}
                    className="justify-start h-auto p-3"
                    onClick={() => handleColorSchemeChange(option.name)}
                  >
                    {option.name !== 'Personalizado' ? (
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: option.primary }}
                        />
                        <span>{option.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Palette className="h-4 w-4" />
                        <span>{option.name}</span>
                      </div>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {selectedColorScheme === 'Personalizado' && (
              <div className="space-y-4">
                <Label>Cores Personalizadas</Label>
                <div className="grid gap-4">
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <div>
                      <Label htmlFor="primary" className="text-xs">Cor Primária</Label>
                      <Input
                        id="primary"
                        name="primary"
                        type="text"
                        value={customColors.primary}
                        onChange={handleCustomColorChange}
                        placeholder="#649FFF"
                      />
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full border"
                      style={{ backgroundColor: customColors.primary }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <div>
                      <Label htmlFor="secondary" className="text-xs">Cor Secundária</Label>
                      <Input
                        id="secondary"
                        name="secondary"
                        type="text"
                        value={customColors.secondary}
                        onChange={handleCustomColorChange}
                        placeholder="#9B66FF"
                      />
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full border"
                      style={{ backgroundColor: customColors.secondary }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                    <div>
                      <Label htmlFor="accent" className="text-xs">Cor de Destaque</Label>
                      <Input
                        id="accent"
                        name="accent"
                        type="text"
                        value={customColors.accent}
                        onChange={handleCustomColorChange}
                        placeholder="#9b87f5"
                      />
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full border"
                      style={{ backgroundColor: customColors.accent }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-6">
            <div>
              <Label htmlFor="systemName">Nome do Sistema</Label>
              <Input
                id="systemName"
                value={systemName}
                onChange={(e) => {
                  setSystemName(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="ERP System"
              />
            </div>
            
            <div>
              <Label>Logo da Empresa</Label>
              <div className="mt-2 border rounded-md p-4 space-y-4">
                {logoPreview && (
                  <div className="flex justify-center">
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="max-h-32 object-contain"
                    />
                  </div>
                )}
                {!logoPreview && (
                  <div className="flex justify-center items-center h-32 bg-muted/20 rounded-md">
                    <Image className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                )}
                <div className="grid w-full">
                  <Label 
                    htmlFor="logo-upload" 
                    className="flex justify-center items-center px-4 py-2 border border-dashed rounded-md cursor-pointer hover:bg-muted/20"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Carregar logo</span>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </Label>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Formatos aceitos: PNG, JPG, SVG (max 2MB)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/10 rounded-md">
              <h3 className="text-sm font-medium mb-2">Visualização</h3>
              <div className="grid gap-2">
                <div 
                  className="p-2 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: customColors.primary, color: 'white' }}
                >
                  Botão primário
                </div>
                <div 
                  className="p-2 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: customColors.secondary, color: 'white' }}
                >
                  Botão secundário
                </div>
                <div 
                  className="p-2 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: customColors.accent, color: 'white' }}
                >
                  Destaque
                </div>
                <div className="text-center text-sm mt-1">
                  Sistema: <strong>{systemName}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualCustomization;
