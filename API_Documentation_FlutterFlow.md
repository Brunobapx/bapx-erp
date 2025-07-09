# 📱 API REST para FlutterFlow - ERP System

## 🚀 Informações Gerais

**Base URL:** `https://gtqmwlxzszttzriswoxj.supabase.co/functions/v1`

**Formato de Dados:** JSON  
**Autenticação:** JWT Bearer Token  
**CORS:** Habilitado para todas as origens

---

## 🔐 Autenticação

### 1. Login
Autenticar usuário e obter tokens de acesso.

**Endpoint:** `POST /api-auth/login`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "usuario@email.com",
      "role": "user"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "v1.MRjVnEtJx1ryJ...",
      "expires_in": 3600
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.MRjVnEtJx1ryJ..."
  },
  "message": "Operação realizada com sucesso"
}
```

**Resposta de Erro (401):**
```json
{
  "success": false,
  "error": "Credenciais inválidas"
}
```

### 2. Perfil do Usuário
Obter informações do usuário autenticado.

**Endpoint:** `GET /api-auth/profile`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "usuario@email.com",
    "role": "user",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Renovar Token
Renovar token de acesso usando refresh token.

**Endpoint:** `POST /api-auth/refresh`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "refresh_token": "v1.MRjVnEtJx1ryJ..."
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "v1.MRjVnEtJx1ryJ...",
      "expires_in": 3600
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "v1.MRjVnEtJx1ryJ..."
  }
}
```

---

## 👥 Clientes

### 1. Listar Clientes
Obter lista paginada de clientes com filtros opcionais.

**Endpoint:** `GET /api-clients`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (Opcionais):**
- `search` (string): Buscar por nome, email, CPF ou CNPJ
- `type` (string): Filtrar por tipo - "PF" ou "PJ"
- `limit` (number): Número de registros por página (padrão: 50)
- `offset` (number): Deslocamento para paginação (padrão: 0)

**Exemplo de URL:**
```
GET /api-clients?search=João&type=PF&limit=20&offset=0
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "João Silva",
        "type": "PF",
        "cpf": "123.456.789-00",
        "rg": "12.345.678-9",
        "email": "joao@email.com",
        "phone": "(11) 99999-9999",
        "address": "Rua das Flores, 123",
        "city": "São Paulo",
        "state": "SP",
        "zip": "01234-567",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### 2. Buscar Cliente por ID
Obter detalhes de um cliente específico.

**Endpoint:** `GET /api-clients/{client_id}`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "type": "PF",
    "cpf": "123.456.789-00",
    "rg": "12.345.678-9",
    "email": "joao@email.com",
    "phone": "(11) 99999-9999",
    "address": "Rua das Flores, 123",
    "number": "123",
    "complement": "Apto 45",
    "bairro": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zip": "01234-567",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### 3. Criar Cliente
Criar um novo cliente.

**Endpoint:** `POST /api-clients`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Maria Santos",
  "type": "PJ",
  "cnpj": "12.345.678/0001-90",
  "ie": "123.456.789.123",
  "email": "maria@empresa.com",
  "phone": "(11) 88888-8888",
  "address": "Av. Paulista, 1000",
  "number": "1000",
  "complement": "Sala 101",
  "bairro": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  "zip": "01310-100"
}
```

**Campos Obrigatórios:**
- `name` (string): Nome do cliente
- `type` (string): "PF" para Pessoa Física ou "PJ" para Pessoa Jurídica

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Maria Santos",
    "type": "PJ",
    "cnpj": "12.345.678/0001-90",
    "ie": "123.456.789.123",
    "email": "maria@empresa.com",
    "phone": "(11) 88888-8888",
    "address": "Av. Paulista, 1000",
    "number": "1000",
    "complement": "Sala 101",
    "bairro": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "zip": "01310-100",
    "created_at": "2024-01-15T11:00:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  },
  "message": "Cliente criado com sucesso"
}
```

### 4. Atualizar Cliente
Atualizar dados de um cliente existente.

**Endpoint:** `PUT /api-clients/{client_id}`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Maria Santos Silva",
  "email": "maria.nova@empresa.com",
  "phone": "(11) 77777-7777"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Maria Santos Silva",
    "email": "maria.nova@empresa.com",
    "phone": "(11) 77777-7777",
    "updated_at": "2024-01-15T12:00:00.000Z"
  },
  "message": "Cliente atualizado com sucesso"
}
```

### 5. Excluir Cliente
Excluir um cliente.

**Endpoint:** `DELETE /api-clients/{client_id}`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Cliente excluído com sucesso"
}
```

---

## 📦 Pedidos

### 1. Listar Pedidos
Obter lista paginada de pedidos com filtros opcionais.

**Endpoint:** `GET /api-orders`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (Opcionais):**
- `status` (string): Filtrar por status - "pending", "approved", "in_production", etc.
- `client_id` (string): Filtrar por cliente específico
- `date_from` (string): Data inicial (ISO 8601) - ex: "2024-01-01"
- `date_to` (string): Data final (ISO 8601) - ex: "2024-01-31"
- `limit` (number): Número de registros por página (padrão: 50)
- `offset` (number): Deslocamento para paginação (padrão: 0)

**Exemplo de URL:**
```
GET /api-orders?status=pending&date_from=2024-01-01&limit=20
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "order_number": "PED-001",
        "client_id": "550e8400-e29b-41d4-a716-446655440000",
        "client_name": "João Silva",
        "total_amount": 150.50,
        "status": "pending",
        "payment_method": "Dinheiro",
        "payment_term": "À vista",
        "delivery_deadline": "2024-01-20",
        "notes": "Entregar pela manhã",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "limit": 20,
    "offset": 0
  }
}
```

### 2. Buscar Pedido por ID
Obter detalhes de um pedido específico incluindo itens.

**Endpoint:** `GET /api-orders/{order_id}`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "order_number": "PED-001",
    "client_id": "550e8400-e29b-41d4-a716-446655440000",
    "client_name": "João Silva",
    "total_amount": 150.50,
    "status": "pending",
    "payment_method": "Dinheiro",
    "payment_term": "À vista",
    "delivery_deadline": "2024-01-20",
    "notes": "Entregar pela manhã",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "order_items": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "product_id": "990e8400-e29b-41d4-a716-446655440004",
        "product_name": "Produto A",
        "quantity": 2,
        "unit_price": 25.50,
        "total_price": 51.00
      },
      {
        "id": "881e8400-e29b-41d4-a716-446655440005",
        "product_id": "991e8400-e29b-41d4-a716-446655440006",
        "product_name": "Produto B",
        "quantity": 1,
        "unit_price": 99.50,
        "total_price": 99.50
      }
    ]
  }
}
```

### 3. Criar Pedido
Criar um novo pedido com itens.

**Endpoint:** `POST /api-orders`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:**
```json
{
  "client_id": "550e8400-e29b-41d4-a716-446655440000",
  "payment_method": "Cartão de Crédito",
  "payment_term": "30 dias",
  "delivery_deadline": "2024-01-25",
  "notes": "Pedido urgente",
  "items": [
    {
      "product_id": "990e8400-e29b-41d4-a716-446655440004",
      "product_name": "Produto A",
      "quantity": 3,
      "unit_price": 25.50
    },
    {
      "product_id": "991e8400-e29b-41d4-a716-446655440006",
      "product_name": "Produto B",
      "quantity": 2,
      "unit_price": 99.50
    }
  ]
}
```

**Campos Obrigatórios:**
- `client_id` (string): ID do cliente
- `items` (array): Lista de itens do pedido
  - `product_id` (string): ID do produto
  - `product_name` (string): Nome do produto
  - `quantity` (number): Quantidade
  - `unit_price` (number): Preço unitário

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "771e8400-e29b-41d4-a716-446655440007",
    "order_number": "PED-002",
    "client_id": "550e8400-e29b-41d4-a716-446655440000",
    "client_name": "João Silva",
    "total_amount": 275.50,
    "status": "pending",
    "payment_method": "Cartão de Crédito",
    "payment_term": "30 dias",
    "delivery_deadline": "2024-01-25",
    "notes": "Pedido urgente",
    "created_at": "2024-01-15T14:00:00.000Z",
    "updated_at": "2024-01-15T14:00:00.000Z"
  },
  "message": "Pedido criado com sucesso"
}
```

### 4. Atualizar Pedido
Atualizar dados de um pedido existente.

**Endpoint:** `PUT /api-orders/{order_id}`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:**
```json
{
  "payment_method": "PIX",
  "notes": "Atualizado para PIX",
  "delivery_deadline": "2024-01-22"
}
```

### 5. Atualizar Status do Pedido
Atualizar apenas o status de um pedido.

**Endpoint:** `PUT /api-orders/{order_id}/status`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:**
```json
{
  "status": "approved"
}
```

**Status Válidos:**
- `pending` - Pendente
- `approved` - Aprovado
- `in_production` - Em Produção
- `in_packaging` - Em Embalagem
- `released_for_sale` - Liberado para Venda
- `sale_confirmed` - Venda Confirmada
- `cancelled` - Cancelado

---

## 🛍️ Produtos

### 1. Listar Produtos
Obter lista paginada de produtos com filtros opcionais.

**Endpoint:** `GET /api-products`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (Opcionais):**
- `category` (string): Filtrar por categoria
- `low_stock` (boolean): Filtrar produtos com estoque baixo (true/false)
- `limit` (number): Número de registros por página (padrão: 50)
- `offset` (number): Deslocamento para paginação (padrão: 0)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "990e8400-e29b-41d4-a716-446655440004",
        "name": "Produto A",
        "sku": "PROD-001",
        "code": "P001",
        "price": 25.50,
        "cost": 15.00,
        "stock": 100,
        "unit": "UN",
        "category": "Categoria A",
        "description": "Descrição do produto",
        "is_manufactured": false,
        "is_direct_sale": true,
        "weight": 0.5,
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "total": 1,
    "limit": 50,
    "offset": 0
  }
}
```

### 2. Buscar Produto por ID
Obter detalhes de um produto específico.

**Endpoint:** `GET /api-products/{product_id}`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Buscar Produtos (Search)
Buscar produtos por nome, SKU ou código.

**Endpoint:** `GET /api-products/search`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**
- `q` (string): Termo de busca (obrigatório)
- `limit` (number): Número de registros (padrão: 20)

**Exemplo de URL:**
```
GET /api-products/search?q=produto&limit=10
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "name": "Produto A",
      "sku": "PROD-001",
      "price": 25.50,
      "stock": 100,
      "unit": "UN"
    }
  ]
}
```

### 4. Atualizar Estoque
Atualizar o estoque de um produto.

**Endpoint:** `PUT /api-products/{product_id}/stock`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:**
```json
{
  "stock": 150
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440004",
    "name": "Produto A",
    "stock": 150,
    "updated_at": "2024-01-15T15:00:00.000Z"
  },
  "message": "Estoque atualizado com sucesso"
}
```

---

## 📊 Dashboard

### 1. Estatísticas Gerais
Obter estatísticas resumidas do sistema.

**Endpoint:** `GET /api-dashboard/stats`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": {
    "total_orders": 150,
    "total_clients": 45,
    "total_products": 200,
    "pending_orders": 12,
    "monthly_revenue": 25000.50
  }
}
```

### 2. Pedidos Recentes
Obter lista dos pedidos mais recentes.

**Endpoint:** `GET /api-dashboard/recent-orders`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (Opcionais):**
- `limit` (number): Número de registros (padrão: 10)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "order_number": "PED-001",
      "client_name": "João Silva",
      "total_amount": 150.50,
      "status": "pending",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3. Produtos com Estoque Baixo
Obter lista de produtos com estoque baixo.

**Endpoint:** `GET /api-dashboard/low-stock`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters (Opcionais):**
- `threshold` (number): Limite de estoque baixo (padrão: 10)

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440004",
      "name": "Produto A",
      "sku": "PROD-001",
      "stock": 5,
      "unit": "UN"
    }
  ]
}
```

---

## 📱 Configuração no FlutterFlow

### 1. Configuração Inicial

1. **Adicionar API Group:**
   - Nome: `ERP_API`
   - Base URL: `https://gtqmwlxzszttzriswoxj.supabase.co/functions/v1`

2. **Configurar Headers Globais:**
   ```
   Content-Type: application/json
   ```

3. **Configurar Autenticação:**
   - Tipo: Bearer Token
   - Variable: `[access_token]`

### 2. Data Types Sugeridos

**User:**
```json
{
  "id": "String",
  "email": "String",
  "role": "String",
  "created_at": "DateTime"
}
```

**Client:**
```json
{
  "id": "String",
  "name": "String",
  "type": "String",
  "cpf": "String?",
  "cnpj": "String?",
  "email": "String?",
  "phone": "String?",
  "address": "String?",
  "city": "String?",
  "state": "String?",
  "created_at": "DateTime"
}
```

**Order:**
```json
{
  "id": "String",
  "order_number": "String",
  "client_id": "String",
  "client_name": "String",
  "total_amount": "double",
  "status": "String",
  "payment_method": "String?",
  "created_at": "DateTime"
}
```

**Product:**
```json
{
  "id": "String",
  "name": "String",
  "sku": "String?",
  "price": "double",
  "stock": "double",
  "unit": "String",
  "category": "String?"
}
```

### 3. Custom Actions Principais

1. **Login Action:**
   - Input: email (String), password (String)
   - Output: User, access_token (String)

2. **Get Clients Action:**
   - Input: search (String?), type (String?), limit (int?), offset (int?)
   - Output: List<Client>, total (int)

3. **Create Order Action:**
   - Input: client_id (String), items (List<OrderItem>)
   - Output: Order

4. **Search Products Action:**
   - Input: query (String), limit (int?)
   - Output: List<Product>

### 4. Gerenciamento de Estado

- **Auth State:** Armazenar access_token e refresh_token
- **User State:** Armazenar dados do usuário logado
- **Cache Local:** Para listas frequentemente acessadas

---

## ❌ Códigos de Erro

| Código | Descrição | Situação |
|--------|-----------|----------|
| 200 | Sucesso | Operação realizada com sucesso |
| 400 | Bad Request | Dados inválidos ou incompletos |
| 401 | Unauthorized | Token inválido ou expirado |
| 404 | Not Found | Recurso não encontrado |
| 405 | Method Not Allowed | Método HTTP não permitido |
| 500 | Internal Server Error | Erro interno do servidor |

## 📝 Formato de Resposta Padrão

**Sucesso:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso"
}
```

**Erro:**
```json
{
  "success": false,
  "error": "Mensagem de erro detalhada"
}
```

---

## 🔧 Testes e Validação

### Exemplo de Teste com cURL

```bash
# Login
curl -X POST https://gtqmwlxzszttzriswoxj.supabase.co/functions/v1/api-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@email.com","password":"senha123"}'

# Listar Clientes
curl -X GET https://gtqmwlxzszttzriswoxj.supabase.co/functions/v1/api-clients \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Ferramentas Recomendadas
- **Postman:** Para testes de API
- **Insomnia:** Alternativa ao Postman
- **FlutterFlow API Tester:** Teste direto no FlutterFlow

---

## 📞 Suporte

Para dúvidas ou problemas com a API, verifique:

1. **Logs do Edge Function:** Supabase Dashboard > Functions > Logs
2. **Status da Autenticação:** Verificar se o token está válido
3. **Formato dos Dados:** Confirmar se o JSON está correto
4. **CORS:** Verificar se as origens estão permitidas

---

*Documentação gerada em: 09/01/2025*  
*Versão da API: 1.0.0*