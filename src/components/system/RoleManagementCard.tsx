import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Database } from "@/integrations/supabase/types";
import RoleManagementHeader from './roles/RoleManagementHeader';
import UserRoleCard from './roles/UserRoleCard';

interface UserRole {
  user_id: string;
  role: Database['public']['Enums']['app_role'];
  full_name: string;
  member_number: string;
  roles?: Database['public']['Enums']['app_role'][];
}

const ITEMS_PER_PAGE = 7;

const getHighestRole = (roles: Database['public']['Enums']['app_role'][]): Database['public']['Enums']['app_role'] => {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('collector')) return 'collector';
  return 'member';
};

const RoleManagementCard = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const { data: users, refetch: refetchUsers } = useQuery({
    queryKey: ['users-with-roles', searchTerm, currentPage],
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('auth_user_id, full_name, member_number')
        .or(`full_name.ilike.%${searchTerm}%,member_number.ilike.%${searchTerm}%`)
        .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

      if (membersError) throw membersError;

      const userIds = members.map(m => m.auth_user_id).filter(Boolean);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) throw rolesError;

      const usersWithRoles = members.map(member => {
        const userRoles = roles.filter(role => role.user_id === member.auth_user_id);
        const rolesList = userRoles.map(r => r.role);
        return {
          user_id: member.auth_user_id,
          full_name: member.full_name,
          member_number: member.member_number,
          roles: rolesList,
          role: rolesList.length > 0 ? getHighestRole(rolesList) : 'member'
        };
      });

      console.log('Users with roles:', usersWithRoles);
      return usersWithRoles;
    }
  });

  const handleRoleChange = async (userId: string, newRole: Database['public']['Enums']['app_role']) => {
    try {
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      toast({
        title: "Role Updated",
        description: `Successfully updated user role to ${newRole}`,
      });

      refetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-dashboard-card border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-dashboard-accent1" />
            <CardTitle className="text-xl font-semibold text-white">Role Management</CardTitle>
          </div>
        </div>
        <CardDescription className="text-dashboard-text mt-2">
          Manage user roles and permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RoleManagementHeader 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
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
        
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="border-dashboard-accent1/20 hover:bg-dashboard-accent1/10 text-dashboard-text"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={!users || users.length < ITEMS_PER_PAGE}
            className="border-dashboard-accent1/20 hover:bg-dashboard-accent1/10 text-dashboard-text"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoleManagementCard;