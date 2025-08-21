import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

interface CompanySettings {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

export function useWhiteLabelSettings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Load company settings
  const loadCompanySettings = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's company_id from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.company_id) {
        toast({
          title: "Erro",
          description: "Empresa não encontrada para este usuário.",
          variant: "destructive",
        });
        return;
      }

      // Load company settings
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id, name, logo_url, primary_color, secondary_color')
        .eq('id', profile.company_id)
        .single();

      if (companyError) throw companyError;

      setCompanySettings(company);
    } catch (error: any) {
      console.error('Error loading company settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Upload logo to storage and update company record
  const updateLogo = async (file: File): Promise<boolean> => {
    if (!companySettings) return false;

    try {
      setUploading(true);

      // Create unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${companySettings.id}-${Date.now()}.${fileExtension}`;
      const filePath = fileName;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      // Update company record
      const { error: updateError } = await supabase
        .from('companies')
        .update({ logo_url: publicUrl })
        .eq('id', companySettings.id);

      if (updateError) throw updateError;

      // Update local state
      setCompanySettings(prev => prev ? { ...prev, logo_url: publicUrl } : null);

      toast({
        title: "Logo atualizado",
        description: "O logo da empresa foi atualizado com sucesso.",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating logo:', error);
      toast({
        title: "Erro ao atualizar logo",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Update company colors
  const updateColors = async (primaryColor: string, secondaryColor: string): Promise<boolean> => {
    if (!companySettings) return false;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          primary_color: primaryColor,
          secondary_color: secondaryColor
        })
        .eq('id', companySettings.id);

      if (error) throw error;

      // Update local state
      setCompanySettings(prev => prev ? { 
        ...prev, 
        primary_color: primaryColor,
        secondary_color: secondaryColor 
      } : null);

      // Apply colors dynamically
      applyColorsToUI(primaryColor, secondaryColor);

      toast({
        title: "Cores atualizadas",
        description: "As cores da empresa foram atualizadas com sucesso.",
      });

      return true;
    } catch (error: any) {
      console.error('Error updating colors:', error);
      toast({
        title: "Erro ao atualizar cores",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Apply colors to UI dynamically
  const applyColorsToUI = (primaryColor: string, secondaryColor: string) => {
    const root = document.documentElement;
    
    // Convert hex to HSL
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;

      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
          default: h = 0;
        }
        h /= 6;
      }

      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    };

    const [h1, s1, l1] = hexToHsl(primaryColor);
    const [h2, s2, l2] = hexToHsl(secondaryColor);

    // Update CSS custom properties
    root.style.setProperty('--primary', `${h1} ${s1}% ${l1}%`);
    root.style.setProperty('--sidebar-primary', `${h1} ${s1}% ${l1}%`);
    root.style.setProperty('--menu-background', `${h2} ${s2}% ${l2}%`);
    root.style.setProperty('--sidebar-background', `${h2} ${s2}% ${l2}%`);
  };

  // Load settings on mount and when user changes
  useEffect(() => {
    loadCompanySettings();
  }, [user]);

  // Apply stored colors on mount
  useEffect(() => {
    if (companySettings?.primary_color && companySettings?.secondary_color) {
      applyColorsToUI(companySettings.primary_color, companySettings.secondary_color);
    }
  }, [companySettings]);

  return {
    companySettings,
    loading,
    uploading,
    updateLogo,
    updateColors,
    reload: loadCompanySettings
  };
}