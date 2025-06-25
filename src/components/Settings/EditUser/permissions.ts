
import { useAuth } from '@/components/Auth/AuthProvider';
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

export const canEditUser = (userRole: string, targetUser: UnifiedUser): boolean => {
  if (!userRole || !targetUser) return false;
  
  // Master pode editar qualquer usuário
  if (userRole === 'master') return true;
  
  // Admin pode editar usuários que não sejam master
  if (userRole === 'admin' && targetUser.role !== 'master') return true;
  
  return false;
};

export const canChangeRole = (userRole: string, targetRole: string): boolean => {
  if (!userRole) return false;
  
  // Master pode alterar qualquer role
  if (userRole === 'master') return true;
  
  // Admin pode alterar roles, exceto master
  if (userRole === 'admin' && targetRole !== 'master') return true;
  
  return false;
};

export const getAvailableRoles = (userRole: string): Array<{value: string, label: string}> => {
  const baseRoles = [
    { value: 'user', label: 'Usuário' },
    { value: 'admin', label: 'Admin' }
  ];
  
  if (userRole === 'master') {
    baseRoles.push({ value: 'master', label: 'Master' });
  }
  
  return baseRoles;
};
