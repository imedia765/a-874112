import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from "@/components/ui/scroll-area";
import UserRoleCard from './UserRoleCard';
import { supabase } from "@/integrations/supabase/client";
import RoleManagementHeader from './RoleManagementHeader';
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

interface UserData {
  id: string;
  user_id: string;
  full_name: string;
  member_number: string;
  role: UserRole;
  roles?: UserRole[];
  auth_user_id: string;
  user_roles: { role: UserRole }[];
}

const RoleManagementList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      console.log('Fetching users with search term:', searchTerm);
      let query = supabase
        .from('members')
        .select(`
          *,
          user_roles (
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      // Transform the data to match the expected format
      return (data || []).map((user): UserData => ({
        id: user.id,
        user_id: user.auth_user_id || '',
        full_name: user.full_name,
        member_number: user.member_number,
        role: user.user_roles?.[0]?.role || 'member',
        auth_user_id: user.auth_user_id || '',
        user_roles: Array.isArray(user.user_roles) ? user.user_roles : []
      }));
    },
  });

  const handleSearchChange = (value: string) => {
    console.log('Search term changed:', value);
    setSearchTerm(value);
  };

  return (
    <div className="space-y-6">
      <RoleManagementHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
      />
      
      <ScrollArea className="h-[600px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dashboard-accent1"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {users?.map((user) => (
              <UserRoleCard
                key={user.id}
                user={user}
                onRoleChange={async () => {
                  await queryClient.invalidateQueries({ queryKey: ['users'] });
                }}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default RoleManagementList;