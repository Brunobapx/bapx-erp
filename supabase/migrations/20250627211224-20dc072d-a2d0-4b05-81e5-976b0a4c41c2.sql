
-- Adicionar campos necessários para emissão de nota fiscal SEFAZ 4.0 na tabela system_settings
-- Campos de identificação fiscal
INSERT INTO public.system_settings (key, value, description, category) VALUES
('company_cnpj', '""', 'CNPJ da Empresa', 'company'),
('company_ie', '""', 'Inscrição Estadual', 'company'),
('company_im', '""', 'Inscrição Municipal', 'company'),
('company_crt', '"1"', 'Código de Regime Tributário (1-Simples Nacional, 2-Simples Nacional - excesso, 3-Regime Normal)', 'company'),
('company_cnae', '""', 'CNAE Principal', 'company');

-- Campos de endereço separados
INSERT INTO public.system_settings (key, value, description, category) VALUES
('company_cep', '""', 'CEP da Empresa', 'company'),
('company_street', '""', 'Logradouro/Rua', 'company'),
('company_number', '""', 'Número', 'company'),
('company_complement', '""', 'Complemento', 'company'),
('company_neighborhood', '""', 'Bairro', 'company'),
('company_city', '""', 'Cidade', 'company'),
('company_state', '""', 'Estado (UF)', 'company'),
('company_ibge_city_code', '""', 'Código IBGE da Cidade', 'company'),
('company_country', '"Brasil"', 'País', 'company'),
('company_country_code', '"1058"', 'Código do País (1058 para Brasil)', 'company');

-- Campos adicionais para SEFAZ
INSERT INTO public.system_settings (key, value, description, category) VALUES
('company_fantasy_name', '""', 'Nome Fantasia', 'company'),
('company_legal_nature', '""', 'Natureza Jurídica', 'company'),
('company_share_capital', '"0"', 'Capital Social', 'company'),
('company_activity_start', '""', 'Data de Início das Atividades', 'company'),
('company_website', '""', 'Site da Empresa', 'company'),
('company_responsible_name', '""', 'Nome do Responsável', 'company'),
('company_responsible_cpf', '""', 'CPF do Responsável', 'company');
