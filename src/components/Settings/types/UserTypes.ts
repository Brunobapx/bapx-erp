
// Define interface for permissions
export interface UserPermissions {
  pedidos: boolean;
  producao: boolean;
  embalagem: boolean;
  vendas: boolean;
  financeiro: boolean;
  rotas: boolean;
  calendario: boolean;
  clientes: boolean;
  produtos: boolean;
  fornecedores: boolean;
  emissao_fiscal: boolean;
  configuracoes: boolean;
}

// Define interface for user
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: UserPermissions;
  isAdmin: boolean;
}

// Define module permissions
export const modules = [
  { id: 'pedidos', name: 'Pedidos' },
  { id: 'producao', name: 'Produção' },
  { id: 'embalagem', name: 'Embalagem' },
  { id: 'vendas', name: 'Vendas' },
  { id: 'financeiro', name: 'Financeiro' },
  { id: 'rotas', name: 'Rotas' },
  { id: 'calendario', name: 'Calendário' },
  { id: 'clientes', name: 'Clientes' },
  { id: 'produtos', name: 'Produtos' },
  { id: 'fornecedores', name: 'Fornecedores' },
  { id: 'emissao_fiscal', name: 'Emissão Fiscal' },
  { id: 'configuracoes', name: 'Configurações' },
];
