import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Palette } from 'lucide-react';
import { useWhiteLabelSettings } from '@/hooks/useWhiteLabelSettings';

export function WhiteLabelSettings() {
  const { toast } = useToast();
  const {
    companySettings,
    loading,
    updateLogo,
    updateColors,
    uploading
  } = useWhiteLabelSettings();

  const [primaryColor, setPrimaryColor] = useState(companySettings?.primary_color || '#93d3e7');
  const [secondaryColor, setSecondaryColor] = useState(companySettings?.secondary_color || '#195e80');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Apenas imagens são permitidas.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!selectedFile) return;
    
    const success = await updateLogo(selectedFile);
    if (success) {
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleUpdateColors = async () => {
    await updateColors(primaryColor, secondaryColor);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Personalização White Label</h2>
        <p className="text-muted-foreground">
          Customize a aparência da sua empresa no sistema
        </p>
      </div>

      {/* Logo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Logo da Empresa
          </CardTitle>
          <CardDescription>
            Envie o logo da sua empresa (máximo 5MB, formatos: PNG, JPG, SVG)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {companySettings?.logo_url && (
              <div className="flex-shrink-0">
                <img
                  src={companySettings.logo_url}
                  alt="Logo atual"
                  className="w-16 h-16 object-contain rounded-lg border border-border"
                />
              </div>
            )}
            <div className="flex-1">
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mb-2"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={handleUploadLogo} 
            disabled={!selectedFile || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Logo'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Color Customization Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Cores da Empresa
          </CardTitle>
          <CardDescription>
            Defina as cores principais da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 p-1 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#93d3e7"
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-16 h-10 p-1 rounded cursor-pointer"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#195e80"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-6 p-4 border border-border rounded-lg">
            <p className="text-sm font-medium mb-3">Preview das Cores:</p>
            <div className="flex gap-4">
              <div 
                className="w-20 h-20 rounded-lg border border-border flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Primária
              </div>
              <div 
                className="w-20 h-20 rounded-lg border border-border flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: secondaryColor }}
              >
                Secundária
              </div>
            </div>
          </div>

          <Button onClick={handleUpdateColors} className="w-full">
            Definir Cores
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}