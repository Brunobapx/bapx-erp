# Guia de Implementação Multi-Tenant EasyPanel

## 📋 Pré-requisitos

### 1. Projetos Supabase (10 unidades)
Criar um projeto Supabase para cada cliente no [dashboard](https://supabase.com/dashboard/projects):

```
Cliente 001: projeto-cliente001
Cliente 002: projeto-cliente002
...
Cliente 010: projeto-cliente010
```

**Importante**: Anotar para cada projeto:
- URL do projeto (https://xxx.supabase.co)
- Anon Key (eyJhbGciOiJIUz...)

### 2. Subdomínios DNS
Configurar no seu provedor DNS (Cloudflare, etc.):

```
cliente001.seudominio.com → A record → IP da VPS
cliente002.seudominio.com → A record → IP da VPS
...
cliente010.seudominio.com → A record → IP da VPS
```

## 🚀 Implementação no EasyPanel

### Passo 1: Aplicação Principal (Template)

1. **Criar primeira aplicação** no EasyPanel:
   - Nome: `erp-cliente001`
   - Tipo: Application
   - Source: GitHub (este repositório)

2. **Configurar Build & Deploy**:
   ```yaml
   Build Command: bun install && bun run build
   Start Command: nginx -g "daemon off;"
   Port: 80
   ```

3. **Variáveis de Ambiente**:
   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO-CLIENTE001.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA-ANON-KEY-CLIENTE001
   ```

4. **Domínio Customizado**:
   - Adicionar: `cliente001.seudominio.com`
   - SSL: Automático

### Passo 2: Testar Primeira Instalação

1. **Deploy e aguardar** build completar
2. **Acessar** https://cliente001.seudominio.com
3. **Verificar**:
   - ✅ Sistema carrega corretamente
   - ✅ Setup automático executa
   - ✅ Login funciona (bapx@bapx.com.br / 123456)
   - ✅ Dados isolados no Supabase do cliente

### Passo 3: Replicar para Demais Clientes

**Para cada cliente (002 a 010):**

1. **Duplicar aplicação** no EasyPanel
2. **Renomear** para `erp-cliente00X`
3. **Atualizar variáveis**:
   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO-CLIENTEXX.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA-ANON-KEY-CLIENTEXX
   ```
4. **Configurar domínio**: `clienteXXX.seudominio.com`
5. **Deploy e testar**

## 📊 Monitoramento

### Dashboard EasyPanel
- **Applications**: Ver status de todas as 10 instalações
- **Metrics**: CPU, RAM, Storage por aplicação
- **Logs**: Logs individuais por cliente
- **SSL**: Status dos certificados

### Supabase Projects
- **Dashboard**: Monitorar cada projeto separadamente
- **Database**: Verificar crescimento de dados
- **Auth**: Usuários por cliente
- **Functions**: Logs das edge functions

## 🔧 Manutenção

### Atualizações
1. **Push** código atualizado no GitHub
2. **Redeploy** todas as aplicações no EasyPanel
3. **Verificar** funcionamento em todas as instalações

### Backup
- **Supabase**: Backup automático por projeto
- **EasyPanel**: Snapshot das aplicações

### Troubleshooting
- **Logs**: EasyPanel → Application → Logs
- **Database**: Supabase → Project → Logs
- **SSL**: EasyPanel → Application → Domains

## 📋 Checklist Final

### Por Cliente:
- [ ] Projeto Supabase criado
- [ ] DNS configurado
- [ ] Aplicação criada no EasyPanel
- [ ] Variáveis configuradas
- [ ] Domínio adicionado
- [ ] SSL funcionando
- [ ] Sistema inicializado
- [ ] Login testado
- [ ] Dados isolados confirmados

### Entrega:
- [ ] Documentação de credenciais
- [ ] Manual do cliente
- [ ] Contatos de suporte
- [ ] URLs de acesso

## 🎯 Resultado Final

**10 ERPs completamente independentes:**
- ✅ https://cliente001.seudominio.com
- ✅ https://cliente002.seudominio.com
- ✅ ...
- ✅ https://cliente010.seudominio.com

**Cada um com:**
- Banco de dados isolado
- Configurações independentes
- SSL automático
- Backup automático
- Monitoramento individual
- Escalabilidade horizontal

## 💡 Próximos Passos

1. **Automatização**: Script para criação automática de novos clientes
2. **Templates**: Template EasyPanel pré-configurado
3. **Monitoring**: Dashboard centralizado de monitoramento
4. **Backup**: Sistema de backup centralizado