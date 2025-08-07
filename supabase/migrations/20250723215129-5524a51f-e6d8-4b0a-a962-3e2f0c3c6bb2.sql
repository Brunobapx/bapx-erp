-- Adicionar campos de configuração de nota fiscal ao system_settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
('nota_fiscal_tipo', '"nfe"'::jsonb, 'Tipo de nota fiscal (nfe, nfce, nfse, cte, mdfe)', 'fiscal'),
('nota_fiscal_ambiente', '"homologacao"'::jsonb, 'Ambiente da nota fiscal (homologacao, producao)', 'fiscal'),
('empresa_tipo', '"MEI"'::jsonb, 'Tipo de empresa (MEI, ME, EPP, LTDA)', 'company'),
('csosn_padrao', '"101"'::jsonb, 'CSOSN padrão para Simples Nacional', 'fiscal'),
('cst_padrao', '"00"'::jsonb, 'CST padrão para regime normal', 'fiscal'),
('icms_percentual', '18'::jsonb, 'Percentual de ICMS padrão', 'fiscal'),
('pis_percentual', '1.65'::jsonb, 'Percentual de PIS padrão', 'fiscal'),
('cofins_percentual', '7.6'::jsonb, 'Percentual de COFINS padrão', 'fiscal')
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
        ('nota_fiscal_tipo', to_jsonb(config_record.tipo_nota), 'Tipo de nota fiscal (nfe, nfce, nfse, cte, mdfe)', 'fiscal'),
        ('nota_fiscal_ambiente', to_jsonb(config_record.ambiente), 'Ambiente da nota fiscal (homologacao, producao)', 'fiscal'),
        ('empresa_tipo', to_jsonb(config_record.tipo_empresa), 'Tipo de empresa (MEI, ME, EPP, LTDA)', 'company'),
        ('csosn_padrao', to_jsonb(config_record.csosn_padrao), 'CSOSN padrão para Simples Nacional', 'fiscal'),
        ('cst_padrao', to_jsonb(config_record.cst_padrao), 'CST padrão para regime normal', 'fiscal'),
        ('icms_percentual', to_jsonb(config_record.icms_percentual), 'Percentual de ICMS padrão', 'fiscal'),
        ('pis_percentual', to_jsonb(config_record.pis_percentual), 'Percentual de PIS padrão', 'fiscal'),
        ('cofins_percentual', to_jsonb(config_record.cofins_percentual), 'Percentual de COFINS padrão', 'fiscal'),
        ('focus_nfe_token', to_jsonb(config_record.token_focus), 'Token Focus NFe', 'fiscal'),
        ('cnpj_emissor', to_jsonb(config_record.cnpj_emissor), 'CNPJ do emissor', 'company')
        ON CONFLICT (key) DO UPDATE SET 
            value = EXCLUDED.value,
            description = EXCLUDED.description,
            category = EXCLUDED.category,
            updated_at = now();
        
        EXIT; -- Processar apenas o primeiro registro
    END LOOP;
END $$;