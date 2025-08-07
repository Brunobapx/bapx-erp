-- Adicionar campos de configuração de nota fiscal ao system_settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
('nota_fiscal_tipo', '"nfe"', 'Tipo de nota fiscal (nfe, nfce, nfse, cte, mdfe)', 'fiscal'),
('nota_fiscal_ambiente', '"homologacao"', 'Ambiente da nota fiscal (homologacao, producao)', 'fiscal'),
('empresa_tipo', '"MEI"', 'Tipo de empresa (MEI, ME, EPP, LTDA)', 'company'),
('csosn_padrao', '"101"', 'CSOSN padrão para Simples Nacional', 'fiscal'),
('cst_padrao', '"00"', 'CST padrão para regime normal', 'fiscal'),
('icms_percentual', '18', 'Percentual de ICMS padrão', 'fiscal'),
('pis_percentual', '1.65', 'Percentual de PIS padrão', 'fiscal'),
('cofins_percentual', '7.6', 'Percentual de COFINS padrão', 'fiscal')
ON CONFLICT (key) DO NOTHING;

-- Migrar dados existentes da tabela nota_configuracoes para system_settings
DO $$
DECLARE
    config_record RECORD;
BEGIN
    -- Buscar configurações existentes na tabela nota_configuracoes
    FOR config_record IN 
        SELECT * FROM public.nota_configuracoes LIMIT 1
    LOOP
        -- Atualizar ou inserir cada campo no system_settings
        INSERT INTO public.system_settings (key, value, description, category) VALUES
        ('nota_fiscal_tipo', '"' || config_record.tipo_nota || '"', 'Tipo de nota fiscal (nfe, nfce, nfse, cte, mdfe)', 'fiscal'),
        ('nota_fiscal_ambiente', '"' || config_record.ambiente || '"', 'Ambiente da nota fiscal (homologacao, producao)', 'fiscal'),
        ('empresa_tipo', '"' || config_record.tipo_empresa || '"', 'Tipo de empresa (MEI, ME, EPP, LTDA)', 'company'),
        ('csosn_padrao', '"' || config_record.csosn_padrao || '"', 'CSOSN padrão para Simples Nacional', 'fiscal'),
        ('cst_padrao', '"' || config_record.cst_padrao || '"', 'CST padrão para regime normal', 'fiscal'),
        ('icms_percentual', config_record.icms_percentual::text, 'Percentual de ICMS padrão', 'fiscal'),
        ('pis_percentual', config_record.pis_percentual::text, 'Percentual de PIS padrão', 'fiscal'),
        ('cofins_percentual', config_record.cofins_percentual::text, 'Percentual de COFINS padrão', 'fiscal'),
        ('focus_nfe_token', '"' || config_record.token_focus || '"', 'Token Focus NFe', 'fiscal'),
        ('cnpj_emissor', '"' || config_record.cnpj_emissor || '"', 'CNPJ do emissor', 'company')
        ON CONFLICT (key) DO UPDATE SET 
            value = EXCLUDED.value,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            updated_at = now();
        
        EXIT; -- Processar apenas o primeiro registro
    END LOOP;
END $$;