
import React from "react";
import { Outlet } from "react-router-dom";

export const Layout: React.FC = () => {
  return (
    <div>
      {/* Main layout */}
      <Outlet />
    </div>
  );
};

export default Layout;
