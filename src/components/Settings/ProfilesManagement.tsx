
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProfiles } from '@/hooks/useProfiles';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import { CreateProfileModal } from './CreateProfileModal';
import { EditProfileModal } from './EditProfileModal';
import { DeleteProfileModal } from './DeleteProfileModal';

export const ProfilesManagement = () => {
  const { profiles, loading } = useProfiles();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Gestão de Perfis de Acesso</h3>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Perfil
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfis Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Nenhum perfil encontrado
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.description}</TableCell>
                    <TableCell>
                      <Badge variant={profile.is_admin ? "default" : "secondary"}>
                        {profile.is_admin ? 'Administrativo' : 'Padrão'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={profile.is_active ? "default" : "secondary"}>
                        {profile.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingProfile(profile.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingProfile(profile.id)}
                          disabled={profile.name === 'Master'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateProfileModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {editingProfile && (
        <EditProfileModal
          profileId={editingProfile}
          open={!!editingProfile}
          onOpenChange={(open) => !open && setEditingProfile(null)}
        />
      )}

      {deletingProfile && (
        <DeleteProfileModal
          profileId={deletingProfile}
          open={!!deletingProfile}
          onOpenChange={(open) => !open && setDeletingProfile(null)}
        />
      )}
    </div>
  );
};
