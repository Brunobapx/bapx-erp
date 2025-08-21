import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';

interface CompanyBranding {
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  name?: string;
}

export function useCompanyBranding() {
  const { user } = useAuth();
  const [branding, setBranding] = useState<CompanyBranding>({});
  const [loading, setLoading] = useState(true);

  const loadBranding = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user's company_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      // Load company branding
      const { data: company } = await supabase
        .from('companies')
        .select('name, logo_url, primary_color, secondary_color')
        .eq('id', profile.company_id)
        .single();

      if (company) {
        setBranding(company);
        
        // Apply colors to UI if they exist
        if (company.primary_color && company.secondary_color) {
          applyBrandingColors(company.primary_color, company.secondary_color);
        }
      }
    } catch (error) {
      console.error('Error loading company branding:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyBrandingColors = (primaryColor: string, secondaryColor: string) => {
    const root = document.documentElement;
    
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

    root.style.setProperty('--primary', `${h1} ${s1}% ${l1}%`);
    root.style.setProperty('--sidebar-primary', `${h1} ${s1}% ${l1}%`);
    root.style.setProperty('--menu-background', `${h2} ${s2}% ${l2}%`);
    root.style.setProperty('--sidebar-background', `${h2} ${s2}% ${l2}%`);
  };

  useEffect(() => {
    loadBranding();
  }, [user]);

  return {
    branding,
    loading,
    reload: loadBranding
  };
}