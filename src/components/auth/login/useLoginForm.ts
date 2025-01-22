import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { clearAuthState, verifyMember, getAuthCredentials, handleSignInError } from './utils/authUtils';
import { updateMemberWithAuthId, addMemberRole } from './utils/memberUtils';

export const useLoginForm = () => {
  const [memberNumber, setMemberNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !memberNumber.trim()) return;
    
    try {
      setLoading(true);
      const isMobile = window.innerWidth <= 768;
      console.log('Starting login process on device type:', isMobile ? 'mobile' : 'desktop');

      // Check maintenance mode first
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_settings')
        .select('is_enabled, message')
        .single();

      if (maintenanceError) {
        console.error('Error checking maintenance mode:', maintenanceError);
        throw new Error('Unable to verify system status');
      }

      // If in maintenance, verify if user is admin before proceeding
      if (maintenanceData?.is_enabled) {
        console.log('System in maintenance mode, checking admin credentials');
        const { email, password } = getAuthCredentials(memberNumber);
        
        // Try admin login
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.log('Login failed during maintenance mode');
          throw new Error(maintenanceData.message || 'System is temporarily offline for maintenance');
        }

        // Check if user is admin
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signInData.user.id);

        const isAdmin = roles?.some(r => r.role === 'admin');
        
        if (!isAdmin) {
          console.log('Non-admin access attempted during maintenance');
          throw new Error(maintenanceData.message || 'System is temporarily offline for maintenance');
        }

        console.log('Admin access granted during maintenance mode');
      }

      // Regular login flow continues
      const member = await verifyMember(memberNumber);
      const { email, password } = getAuthCredentials(memberNumber);
      
      console.log('Attempting sign in with:', { email });
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError && signInError.message.includes('Invalid login credentials')) {
        console.log('Sign in failed, attempting signup');
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              member_number: memberNumber,
            }
          }
        });

        if (signUpError) {
          console.error('Signup error:', signUpError);
          throw signUpError;
        }

        if (signUpData.user) {
          await updateMemberWithAuthId(member.id, signUpData.user.id);
          await addMemberRole(signUpData.user.id);

          console.log('Member updated and role assigned, attempting final sign in');
          
          const { data: finalSignInData, error: finalSignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (finalSignInError) {
            console.error('Final sign in error:', finalSignInError);
            throw finalSignInError;
          }

          if (!finalSignInData?.session) {
            throw new Error('Failed to establish session after signup');
          }
        }
      } else if (signInError) {
        await handleSignInError(signInError, email, password);
      }

      await queryClient.cancelQueries();
      await queryClient.clear();

      console.log('Verifying session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session verification error:', sessionError);
        throw sessionError;
      }

      if (!session) {
        console.error('No session established');
        throw new Error('Failed to establish session');
      }

      console.log('Session established successfully');
      await queryClient.invalidateQueries();

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      if (isMobile) {
        window.location.href = '/';
      } else {
        navigate('/', { replace: true });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      toast({
        title: "Login failed",
        description: error.message || 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    memberNumber,
    setMemberNumber,
    loading,
    handleLogin,
  };
};