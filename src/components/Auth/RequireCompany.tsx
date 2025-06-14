
import React from "react";

interface RequireCompanyProps {
  children: React.ReactNode;
}

export const RequireCompany: React.FC<RequireCompanyProps> = ({ children }) => {
  return <>{children}</>;
};

export default RequireCompany;
