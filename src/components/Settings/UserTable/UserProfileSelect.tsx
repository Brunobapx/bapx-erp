
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UnifiedUser } from '@/hooks/useUnifiedUserManagement';

interface UserProfileSelectProps {
  user: UnifiedUser;
  canManage: boolean;
  availableProfiles: Array<{id: string; name: string; description: string; is_active: boolean}>;
  onProfileChange: (userId: string, profileId: string) => Promise<boolean>;
  displayName: string;
}

const NO_PROFILE_VALUE = '__no_profile__';

export const UserProfileSelect: React.FC<UserProfileSelectProps> = ({
  user,
  canManage,
  availableProfiles,
  onProfileChange,
  displayName,
}) => {
  const handleProfileChange = async (profileId: string) => {
    const actualProfileId = profileId === NO_PROFILE_VALUE ? '' : profileId;
    await onProfileChange(user.id, actualProfileId);
  };

  return (
    <Select
      value={user.profile_id || NO_PROFILE_VALUE}
      disabled={!canManage}
      onValueChange={handleProfileChange}
    >
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Selecionar perfil">
          {displayName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_PROFILE_VALUE}>Sem perfil</SelectItem>
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
