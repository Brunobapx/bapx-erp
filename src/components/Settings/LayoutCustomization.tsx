
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Palette, Upload, Monitor } from 'lucide-react';

const ColorPicker = ({ label, color, onChange }: { label: string; color: string; onChange: (color: string) => void }) => {
  return (
    <div className="flex items-center gap-3">
      <Label htmlFor={`color-${label}`} className="w-32">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          id={`color-${label}`}
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-14 h-8 p-1"
        />
        <Input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="w-28"
          maxLength={7}
        />
      </div>
    </div>
  );
};

const LayoutCustomization = () => {
  const { toast } = useToast();
  const [mainColors, setMainColors] = useState({
    primary: '#9b87f5',
    background: '#F7F9FC',
    text: '#333333',
    accent: '#4ECDC4',
  });

  const [moduleColors, setModuleColors] = useState({
    order: '#9B66FF',
    production: '#4ECDC4',
    packaging: '#FF8B64',
    sales: '#649FFF',
    finance: '#41B883',
    route: '#FFC75F',
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [favicon, setFavicon] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  
  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFavicon(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  const handleMainColorChange = (colorKey: keyof typeof mainColors, value: string) => {
    setMainColors(prev => ({ ...prev, [colorKey]: value }));
  };

  const handleModuleColorChange = (colorKey: keyof typeof moduleColors, value: string) => {
    setModuleColors(prev => ({ ...prev, [colorKey]: value }));
  };

  const handleSaveColors = () => {
    // Here you would typically save the colors to your state management or backend
    toast({
      title: "Cores salvas",
      description: "As configurações de cores foram salvas com sucesso.",
    });
  };

  const handleSaveLogos = () => {
    // Here you would typically upload the images to your backend
    toast({
      title: "Logos salvos",
      description: "Os logos foram salvos com sucesso.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalização de Interface</CardTitle>
        <CardDescription>Personalize as cores, logos e elementos da interface do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors">
          <TabsList className="mb-6">
            <TabsTrigger value="colors">
              <Palette className="h-4 w-4 mr-2" />
              Cores
            </TabsTrigger>
            <TabsTrigger value="logos">
              <Upload className="h-4 w-4 mr-2" />
              Logos
            </TabsTrigger>
            <TabsTrigger value="interface">
              <Monitor className="h-4 w-4 mr-2" />
              Interface
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cores Principais</h3>
              <div className="grid gap-4">
                <ColorPicker 
                  label="Cor Primária" 
                  color={mainColors.primary} 
                  onChange={(value) => handleMainColorChange('primary', value)} 
                />
                <ColorPicker 
                  label="Cor de Fundo" 
                  color={mainColors.background} 
                  onChange={(value) => handleMainColorChange('background', value)} 
                />
                <ColorPicker 
                  label="Cor de Texto" 
                  color={mainColors.text} 
                  onChange={(value) => handleMainColorChange('text', value)} 
                />
                <ColorPicker 
                  label="Cor de Destaque" 
                  color={mainColors.accent} 
                  onChange={(value) => handleMainColorChange('accent', value)} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cores dos Módulos</h3>
              <div className="grid gap-4">
                <ColorPicker 
                  label="Pedidos" 
                  color={moduleColors.order} 
                  onChange={(value) => handleModuleColorChange('order', value)} 
                />
                <ColorPicker 
                  label="Produção" 
                  color={moduleColors.production} 
                  onChange={(value) => handleModuleColorChange('production', value)} 
                />
                <ColorPicker 
                  label="Embalagem" 
                  color={moduleColors.packaging} 
                  onChange={(value) => handleModuleColorChange('packaging', value)} 
                />
                <ColorPicker 
                  label="Vendas" 
                  color={moduleColors.sales} 
                  onChange={(value) => handleModuleColorChange('sales', value)} 
                />
                <ColorPicker 
                  label="Financeiro" 
                  color={moduleColors.finance} 
                  onChange={(value) => handleModuleColorChange('finance', value)} 
                />
                <ColorPicker 
                  label="Roteirização" 
                  color={moduleColors.route} 
                  onChange={(value) => handleModuleColorChange('route', value)} 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSaveColors}>Salvar Configurações de Cores</Button>
            </div>
          </TabsContent>

          <TabsContent value="logos" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="logo-upload" className="text-lg font-medium">Logo da Empresa</Label>
                  <p className="text-sm text-muted-foreground">
                    Esta logo será exibida nos menus, relatórios e telas do sistema.
                  </p>
                </div>
                <div className="border rounded-md p-4 flex flex-col items-center justify-center min-h-[200px]">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="max-h-[180px] object-contain mb-4" />
                  ) : (
                    <div className="text-center text-muted-foreground mb-4">
                      <Upload className="h-12 w-12 mx-auto mb-2" />
                      <p>Nenhum logo selecionado</p>
                    </div>
                  )}
                  <div>
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <span className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90">
                        {logoPreview ? "Trocar Logo" : "Selecionar Logo"}
                      </span>
                    </label>
                    <Input 
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="favicon-upload" className="text-lg font-medium">Favicon</Label>
                  <p className="text-sm text-muted-foreground">
                    Este ícone será exibido na aba do navegador.
                  </p>
                </div>
                <div className="border rounded-md p-4 flex flex-col items-center justify-center min-h-[200px]">
                  {faviconPreview ? (
                    <img src={faviconPreview} alt="Favicon preview" className="h-16 w-16 object-contain mb-4" />
                  ) : (
                    <div className="text-center text-muted-foreground mb-4">
                      <Upload className="h-12 w-12 mx-auto mb-2" />
                      <p>Nenhum favicon selecionado</p>
                    </div>
                  )}
                  <div>
                    <label htmlFor="favicon-upload" className="cursor-pointer">
                      <span className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90">
                        {faviconPreview ? "Trocar Favicon" : "Selecionar Favicon"}
                      </span>
                    </label>
                    <Input 
                      id="favicon-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFaviconChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleSaveLogos}>Salvar Logos</Button>
            </div>
          </TabsContent>

          <TabsContent value="interface" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configurações de Interface</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <Label htmlFor="sidebar-collapsed" className="text-base font-medium">
                      Iniciar com menu lateral recolhido
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      O menu lateral será inicializado recolhido ao abrir o sistema
                    </p>
                  </div>
                  <div>
                    <input 
                      id="sidebar-collapsed"
                      type="checkbox"
                      className="toggle toggle-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <Label htmlFor="dark-mode" className="text-base font-medium">
                      Modo Escuro
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Ativa o tema escuro para o sistema
                    </p>
                  </div>
                  <div>
                    <input 
                      id="dark-mode"
                      type="checkbox"
                      className="toggle toggle-primary"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <Label htmlFor="compact-mode" className="text-base font-medium">
                      Modo Compacto
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Reduz o espaçamento entre elementos para mostrar mais conteúdo
                    </p>
                  </div>
                  <div>
                    <input 
                      id="compact-mode"
                      type="checkbox"
                      className="toggle toggle-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={() => toast({ title: "Configurações salvas", description: "As configurações de interface foram salvas com sucesso." })}>
                Salvar Configurações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LayoutCustomization;
