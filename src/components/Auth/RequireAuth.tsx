
import React from "react";

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  return <>{children}</>;
};

export default RequireAuth;
