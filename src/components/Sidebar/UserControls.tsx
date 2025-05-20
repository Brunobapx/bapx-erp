
import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const UserControls = () => {
  const { user, logout } = useAuth();

  return (
    <div className="p-4 border-t border-sidebar-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            {user?.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={logout} 
          title="Sair do sistema"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default UserControls;
