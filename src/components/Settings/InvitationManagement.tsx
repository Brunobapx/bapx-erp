import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from 'lucide-react';
import { InviteUserModal } from './InviteUserModal';
import { InvitationsTable } from './InvitationsTable';

export const InvitationManagement: React.FC = () => {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciar Convites</CardTitle>
              <CardDescription>
                Convide novos usuários para sua empresa através de email
              </CardDescription>
            </div>
            <Button onClick={() => setInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <InvitationsTable />
        </CardContent>
      </Card>

      <InviteUserModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />
    </div>
  );
};