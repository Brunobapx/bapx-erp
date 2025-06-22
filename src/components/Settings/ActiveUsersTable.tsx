
import React from 'react';
import { Table, TableBody } from "@/components/ui/table";
import { UserTableHeader } from './ActiveUsersTable/UserTableHeader';
import { UserTableRow } from './ActiveUsersTable/UserTableRow';
import { LoadingState } from './ActiveUsersTable/LoadingState';
import { EmptyState } from './ActiveUsersTable/EmptyState';
import { ActiveUsersTableProps } from './ActiveUsersTable/types';

const ActiveUsersTable: React.FC<ActiveUsersTableProps> = ({
  users, 
  availableProfiles, 
  userRole, 
  currentUserId,
  onStatusChange, 
  onProfileChange, 
  onDeleteUser,
  loading = false
}) => {
  if (loading) {
    return <LoadingState />;
  }

  console.log('Available profiles in table:', availableProfiles);
  console.log('Users in table:', users);

  return (
    <div className="space-y-4">
      <h4 className="text-md font-medium">Usuários do Sistema</h4>
      {users.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <Table>
          <UserTableHeader />
          <TableBody>
            {users.map((user) => (
              <UserTableRow
                key={user.id}
                user={user}
                availableProfiles={availableProfiles}
                userRole={userRole}
                currentUserId={currentUserId}
                onStatusChange={onStatusChange}
                onProfileChange={onProfileChange}
                onDeleteUser={onDeleteUser}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default ActiveUsersTable;
