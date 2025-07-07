import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { EditUserModal } from './EditUserModal';
import { User, Edit } from 'lucide-react';
import { useEffect } from 'react';
import type { User as UserType } from '@/hooks/useUserManagement';

export const CurrentUserProfile = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do usuário autenticado
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) return;

      // Buscar role do usuário
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      // Buscar permissões de módulos
      const { data: permissions } = await supabase
        .from('user_module_permissions')
        .select(`
          system_modules (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      const userModules = permissions?.map((p: any) => p.system_modules?.name).filter(Boolean) || [];
      const moduleIds = permissions?.map((p: any) => p.system_modules?.id).filter(Boolean) || [];

      setCurrentUser({
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata || {},
        created_at: user.created_at,
        role: roleData?.role || 'user',
        modules: userModules,
        moduleIds
      });
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleProfileUpdate = () => {
    fetchCurrentUser();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-muted h-12 w-12"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser) return null;

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'master': return 'default';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master': return 'Master';
      case 'admin': return 'Administrador';
      default: return 'Usuário';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Meu Perfil
              </CardTitle>
              <CardDescription>
                Visualize e edite suas informações pessoais
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={currentUser.user_metadata.avatar_url} />
              <AvatarFallback>
                {currentUser.user_metadata.first_name?.charAt(0)}
                {currentUser.user_metadata.last_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="font-semibold text-lg">
                  {currentUser.user_metadata.first_name} {currentUser.user_metadata.last_name}
                </h3>
                <p className="text-muted-foreground">{currentUser.email}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(currentUser.role || 'user')}>
                  {getRoleLabel(currentUser.role || 'user')}
                </Badge>
                
                {currentUser.role === 'user' && currentUser.modules && currentUser.modules.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {currentUser.modules.slice(0, 3).map((module, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {module}
                      </Badge>
                    ))}
                    {currentUser.modules.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{currentUser.modules.length - 3} mais
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Membro desde {new Date(currentUser.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditUserModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        user={currentUser}
        onSuccess={handleProfileUpdate}
        isCurrentUser={true}
      />
    </>
  );
};