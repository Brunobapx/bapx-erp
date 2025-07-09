# API REST para FlutterFlow

## Base URL
```
https://gtqmwlxzszttzriswoxj.supabase.co/functions/v1
```

## Autenticação

### Login
```http
POST /api-auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@email.com",
      "role": "user"
    },
    "access_token": "jwt_token",
    "refresh_token": "refresh_token"
  }
}
```

### Perfil do Usuário
```http
GET /api-auth/profile
Authorization: Bearer jwt_token
```

### Refresh Token
```http
POST /api-auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_token"
}
```

## Clientes

### Listar Clientes
```http
GET /api-clients?search=termo&type=PF&limit=50&offset=0
Authorization: Bearer jwt_token
```

### Buscar Cliente
```http
GET /api-clients/{id}
Authorization: Bearer jwt_token
```

### Criar Cliente
```http
POST /api-clients
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "Nome do Cliente",
  "type": "PF",
  "cpf": "123.456.789-00",
  "email": "cliente@email.com",
  "phone": "(11) 99999-9999"
}
```

### Atualizar Cliente
```http
PUT /api-clients/{id}
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "name": "Nome Atualizado",
  "email": "novo@email.com"
}
```

## Pedidos

### Listar Pedidos
```http
GET /api-orders?status=pending&client_id=uuid&date_from=2024-01-01&limit=50
Authorization: Bearer jwt_token
```

### Buscar Pedido
```http
GET /api-orders/{id}
Authorization: Bearer jwt_token
```

### Criar Pedido
```http
POST /api-orders
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "client_id": "uuid",
  "payment_method": "Dinheiro",
  "items": [
    {
      "product_id": "uuid",
      "product_name": "Produto",
      "quantity": 2,
      "unit_price": 10.50
    }
  ]
}
```

### Atualizar Status
```http
PUT /api-orders/{id}/status
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "status": "approved"
}
```

## Produtos

### Listar Produtos
```http
GET /api-products?category=categoria&low_stock=true&limit=50
Authorization: Bearer jwt_token
```

### Buscar Produto
```http
GET /api-products/{id}
Authorization: Bearer jwt_token
```

### Buscar Produtos (Search)
```http
GET /api-products/search?q=termo&limit=20
Authorization: Bearer jwt_token
```

### Atualizar Estoque
```http
PUT /api-products/{id}/stock
Authorization: Bearer jwt_token
Content-Type: application/json

{
  "stock": 50
}
```

## Dashboard

### Estatísticas
```http
GET /api-dashboard/stats
Authorization: Bearer jwt_token
```

**Resposta:**
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

### Pedidos Recentes
```http
GET /api-dashboard/recent-orders?limit=10
Authorization: Bearer jwt_token
```

### Produtos com Estoque Baixo
```http
GET /api-dashboard/low-stock?threshold=10
Authorization: Bearer jwt_token
```

## Códigos de Status

- `200` - Sucesso
- `400` - Dados inválidos
- `401` - Não autorizado
- `404` - Não encontrado
- `405` - Método não permitido
- `500` - Erro interno

## Formato de Resposta Padrão

**Sucesso:**
```json
{
  "success": true,
  "data": {...},
  "message": "Operação realizada com sucesso"
}
```

**Erro:**
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

## FlutterFlow Configuration

1. Configure a base URL: `https://gtqmwlxzszttzriswoxj.supabase.co/functions/v1`
2. Adicione header `Authorization: Bearer [token]` em todas as requisições
3. Configure Data Types baseados nas respostas da API
4. Use Custom Actions para cada endpoint