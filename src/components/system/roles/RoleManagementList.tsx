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
  auth_user_id: string;
  user_roles: Array<{ role: UserRole }>;
}

const ITEMS_PER_PAGE = 10;

const RoleManagementList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchTerm, page],
    queryFn: async () => {
      console.log('Fetching users with search term:', searchTerm, 'page:', page);
      
      try {
        // First verify if current user has admin access
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const { data: currentUserRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) throw rolesError;

        const isAdmin = currentUserRoles?.some(role => role.role === 'admin');
        if (!isAdmin) {
          throw new Error('Unauthorized: Admin access required');
        }

        // Then get paginated members
        let query = supabase
          .from('members')
          .select('*')
          .order('created_at', { ascending: false })
          .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

        if (searchTerm) {
          query = query.or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%`);
        }

        const { data: membersData, error: membersError } = await query;

        if (membersError) {
          console.error('Error fetching members:', membersError);
          throw membersError;
        }

        // Then get roles for each member
        const usersWithRoles = await Promise.all(membersData.map(async (member) => {
          if (!member.auth_user_id) return { ...member, user_roles: [] };

          try {
            const { data: roleData, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', member.auth_user_id);

            if (roleError) {
              console.error('Error fetching roles for member:', member.member_number, roleError);
              return { ...member, user_roles: [] };
            }

            return {
              ...member,
              user_roles: roleData || []
            };
          } catch (error) {
            console.error('Error in role fetch:', error);
            return { ...member, user_roles: [] };
          }
        }));

        return usersWithRoles.map((user): UserData => ({
          id: user.id,
          user_id: user.auth_user_id || '',
          full_name: user.full_name,
          member_number: user.member_number,
          role: user.user_roles[0]?.role || 'member',
          auth_user_id: user.auth_user_id || '',
          user_roles: user.user_roles
        }));
      } catch (error: any) {
        console.error('Error in user fetch:', error);
        toast({
          title: "Error fetching users",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="space-y-6">
      <RoleManagementHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      
      <ScrollArea 
        className="h-[600px]"
        onScroll={handleScroll}
      >
        {isLoading && page === 0 ? (
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
            {isLoading && page > 0 && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-dashboard-accent1"></div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default RoleManagementList;