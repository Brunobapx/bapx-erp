
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleUser } from '@/hooks/useUserData';

interface UserProfileSelectProps {
  user: SimpleUser;
  canManage: boolean;
  availableProfiles: Array<{id: string; name: string; description: string; is_active: boolean}>;
  onProfileChange: (userId: string, profileId: string) => void;
  displayName: string;
}

export const UserProfileSelect: React.FC<UserProfileSelectProps> = ({
  user,
  canManage,
  availableProfiles,
  onProfileChange,
  displayName,
}) => {
  return (
    <Select
      value={user.profile_id || ''}
      disabled={!canManage}
      onValueChange={(profileId) => onProfileChange(user.id, profileId)}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Selecionar perfil">
          {displayName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Sem perfil</SelectItem>
        {availableProfiles
          .filter(profile => profile?.is_active)
          .map(profile => (
            <SelectItem value={profile.id} key={profile.id}>
              {profile.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};
