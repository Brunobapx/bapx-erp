
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthHeader } from '@/components/Auth/AuthHeader';
import { AuthForm } from '@/components/Auth/AuthForm';
import { useAuthForm } from '@/hooks/useAuthForm';
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const navigate = useNavigate();
  const { 
    username, 
    setUsername,
    password, 
    setPassword,
    isLoading,
    isCreatingUsers,
    mode,
    handleAuthentication,
    toggleMode,
    createDefaultUsers
  } = useAuthForm();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // User is already logged in, redirect to dashboard
        navigate("/");
      }
    };
    
    checkSession();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30 p-4">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader 
          title="Smooth Production" 
          subtitle="Sistema de Gerenciamento de Produção" 
        />

        <AuthForm
          mode={mode}
          username={username}
          password={password}
          isLoading={isLoading}
          isCreatingUsers={isCreatingUsers}
          onUsernameChange={(e) => setUsername(e.target.value)}
          onPasswordChange={(e) => setPassword(e.target.value)}
          onSubmit={handleAuthentication}
          onToggleMode={toggleMode}
          onCreateDefaultUsers={createDefaultUsers}
        />
      </div>
    </div>
  );
};

export default LoginPage;
