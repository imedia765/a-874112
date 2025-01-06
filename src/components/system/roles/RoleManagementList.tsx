import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollArea } from "@/components/ui/scroll-area";
import UserRoleCard from './UserRoleCard';
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

interface UserWithRoles {
  user_id: string;
  full_name: string;
  member_number: string;
  roles?: Database['public']['Enums']['app_role'][];
  role: Database['public']['Enums']['app_role'];
}

export const RoleManagementList = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRoleChange = async (userId: string, newRole: Database['public']['Enums']['app_role']) => {
    try {
      console.log('Updating role for user:', userId, 'to:', newRole);
      
      // First delete existing roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing roles:', deleteError);
        throw deleteError;
      }

      // Then insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) {
        console.error('Error inserting new role:', insertError);
        throw insertError;
      }

      await queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      
      toast({
        title: "Role Updated",
        description: `Successfully updated user role to ${newRole}`,
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const { data: users } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      console.log('Fetching users with roles...');
      
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('auth_user_id, full_name, member_number');

      if (membersError) throw membersError;

      const userIds = members.map(m => m.auth_user_id).filter(Boolean);
      
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = members
        .filter(m => m.auth_user_id) // Only include members with auth_user_id
        .map(member => {
          const userRoles = roles.filter(role => role.user_id === member.auth_user_id);
          const rolesList = userRoles.map(r => r.role);
          return {
            user_id: member.auth_user_id,
            full_name: member.full_name,
            member_number: member.member_number,
            roles: rolesList,
            role: rolesList.length > 0 ? rolesList[0] : 'member'
          };
        });

      console.log('Users with roles:', usersWithRoles);
      return usersWithRoles as UserWithRoles[];
    }
  });

  return (
    <ScrollArea className="h-[400px] w-full rounded-md pr-4">
      <div className="space-y-4">
        {users?.map((user) => (
          <UserRoleCard
            key={user.user_id}
            user={user}
            onRoleChange={handleRoleChange}
          />
        ))}
      </div>
    </ScrollArea>
  );
};