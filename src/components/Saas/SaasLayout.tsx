
import React from "react";
import { Outlet } from "react-router-dom";

export const SaasLayout: React.FC = () => {
  return (
    <div>
      {/* SaaS Layout */}
      <Outlet />
    </div>
  );
};

export default SaasLayout;
