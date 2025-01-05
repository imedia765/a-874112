import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export type UserRole = 'member' | 'collector' | 'admin' | null;

const ROLE_STALE_TIME = 1000 * 60 * 5; // 5 minutes

export const useRoleAccess = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // First check if we have a valid session
  const { data: sessionData, error: sessionError } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    },
    retry: false
  });

  // If session check fails, redirect to login
  useEffect(() => {
    if (sessionError) {
      console.error('Session error:', sessionError);
      toast({
        title: "Session expired",
        description: "Please sign in again",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [sessionError, navigate, toast]);

  const { data: userRole, isLoading: roleLoading, error: roleError } = useQuery({
    queryKey: ['userRole', sessionData?.user?.id],
    queryFn: async () => {
      if (!sessionData?.user) {
        console.log('No session found in central role check');
        return null;
      }

      console.log('Session user in central role check:', sessionData.user.id);
      console.log('User metadata:', sessionData.user.user_metadata);

      try {
        // First try to get roles from user_roles table
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', sessionData.user.id);

        if (roleError) {
          console.error('Error fetching roles from user_roles:', roleError);
          throw roleError;
        }

        // If we found roles, return the highest priority role
        if (roleData && roleData.length > 0) {
          const roles = roleData.map(r => r.role);
          console.log('Found roles in user_roles table:', roles);
          
          // Return highest priority role
          if (roles.includes('admin')) return 'admin';
          if (roles.includes('collector')) return 'collector';
          if (roles.includes('member')) return 'member';
        }

        // If no role in user_roles table, check if user is a collector
        const { data: collectorData, error: collectorError } = await supabase
          .from('members_collectors')
          .select('name')
          .eq('member_number', sessionData.user.user_metadata.member_number)
          .maybeSingle();

        if (collectorError) {
          console.error('Error checking collector status:', collectorError);
          throw collectorError;
        }

        if (collectorData) {
          console.log('User is a collector based on members_collectors table');
          return 'collector' as UserRole;
        }

        // If still no role found, check if user exists in members table
        const { data: memberData, error: memberError } = await supabase
          .from('members')
          .select('id')
          .eq('auth_user_id', sessionData.user.id)
          .maybeSingle();

        if (memberError) {
          console.error('Error checking member status:', memberError);
          throw memberError;
        }

        if (memberData?.id) {
          console.log('User is a regular member');
          return 'member' as UserRole;
        }

        console.log('No role found, defaulting to member');
        return 'member' as UserRole;
      } catch (error) {
        console.error('Error in role check:', error);
        throw error;
      }
    },
    enabled: !!sessionData?.user?.id,
    staleTime: ROLE_STALE_TIME,
    retry: 1,
    meta: {
      errorMessage: "Failed to fetch user role"
    }
  });

  const canAccessTab = (tab: string): boolean => {
    console.log('Checking access for tab:', tab, 'User role:', userRole);
    
    if (!userRole) return false;

    switch (userRole) {
      case 'admin':
        return true;
      case 'collector':
        return ['dashboard', 'users'].includes(tab);
      case 'member':
        return tab === 'dashboard';
      default:
        return false;
    }
  };

  return {
    userRole,
    roleLoading: roleLoading || !sessionData,
    error: roleError,
    canAccessTab,
  };
};