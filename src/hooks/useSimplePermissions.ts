
import { useProfilePermissions } from './useProfilePermissions';

export const useSimplePermissions = () => {
  const { hasAccess, getAllowedRoutes, userRole } = useProfilePermissions();

  return {
    hasAccess,
    getAllowedRoutes,
    userRole,
  };
};
