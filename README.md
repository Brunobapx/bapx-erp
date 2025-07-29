# Sistema ERP - Setup Automático

Sistema completo de gestão empresarial desenvolvido com React, TypeScript e Supabase.

## 🚀 Setup Automático de Banco de Dados

**Novidade**: O sistema agora **cria automaticamente todas as tabelas** quando instalado em uma VPS com banco vazio!

### ✨ Recursos do Setup Automático

- 🔍 **Detecção Inteligente**: Verifica automaticamente se é a primeira instalação
- 📊 **Criação Completa**: Todas as tabelas, funções e relacionamentos
- 👤 **Usuário Master**: Cria automaticamente (bapx@bapx.com.br / 123456)
- ⚙️ **Configurações Padrão**: Módulos do sistema, categorias financeiras, métodos de pagamento
- 🛡️ **Segurança**: Políticas RLS e permissões já configuradas

### 🔧 Como Funciona

1. **Deploy Automático**: Ao fazer deploy, o sistema detecta se o banco está vazio
2. **Inicialização**: Executa automaticamente o setup do banco de dados
3. **Pronto para Usar**: Sistema completamente configurado na primeira execução

### 📋 Scripts Disponíveis

```bash
# Setup automático (executado automaticamente no deploy)
./scripts/setup-database.sh

# Setup manual (para desenvolvimento/troubleshooting)
./scripts/manual-setup.sh
```

## Características do Sistema

- **Dashboard Interativo**: Visão geral de vendas, estoque e métricas
- **Gestão de Vendas**: Pedidos, vendas e controle de estoque
- **Financeiro**: Contas a receber, contas a pagar e fluxo de caixa
- **Produção**: Controle de produção e embalagem
- **Nota Fiscal**: Integração com Focus NFe
- **Multi-usuário**: Sistema de permissões e roles

## Tecnologias Utilizadas

Este projeto foi construído com:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Database & Auth)

## 🚀 Deploy Rápido

### Opção 1: EasyPanel (Recomendado)
1. Configure suas variáveis de ambiente no EasyPanel
2. Faça deploy do projeto
3. **O banco será configurado automaticamente na primeira execução**

### Opção 2: Docker
```bash
# Clone o repositório
git clone <YOUR_GIT_URL>

# Configure o .env com suas credenciais Supabase
cp .env.example .env

# Execute com Docker
docker-compose up -d
```

### Opção 3: Manual
```bash
# Clone e instale dependências
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install

# Execute setup manual do banco
./scripts/manual-setup.sh

# Inicie o desenvolvimento
npm run dev
```

## 🔑 Credenciais Padrão

Após a instalação automática, use estas credenciais para primeiro acesso:

- **Email**: bapx@bapx.com.br
- **Senha**: 123456

⚠️ **IMPORTANTE**: Altere a senha do usuário master após o primeiro login!

## 📝 Edição do Código

**Use Lovable**

Visite o [Projeto Lovable](https://lovable.dev/projects/371b12f9-f6fd-4dc1-93ac-a06f8ee2f13d) e comece a fazer prompts.

**Use seu IDE preferido**

Se quiser trabalhar localmente:

```sh
# Instale Node.js & npm - [instalar com nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

# Clone o repositório
git clone <YOUR_GIT_URL>

# Navegue para o diretório
cd <YOUR_PROJECT_NAME>

# Instale dependências
npm i

# Inicie o servidor de desenvolvimento
npm run dev
```

## 📖 Documentação

Para documentação completa de deployment, consulte [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🆘 Suporte

Se encontrar problemas durante a instalação:

1. Verifique se as variáveis de ambiente estão corretas
2. Execute o setup manual: `./scripts/manual-setup.sh`
3. Consulte os logs do container para mais detalhes