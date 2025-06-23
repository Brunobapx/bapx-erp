
import { SimpleUser } from '@/types/user';

export const canManageUser = (userRole: string, targetUser: SimpleUser): boolean => {
  if (userRole === 'master') return true;
  if (userRole === 'admin' && targetUser.role !== 'master') return true;
  return false;
};
