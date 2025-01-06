import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

export const useAuthSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAuthError = async (error: any) => {
    console.error('Auth error:', error);
    
    const errorMessage = typeof error === 'string' ? error : error.message || error.error_description;
    
    if (errorMessage?.includes('Failed to fetch') || 
        errorMessage?.includes('session_not_found') || 
        errorMessage?.includes('JWT expired') ||
        errorMessage?.includes('Invalid Refresh Token') ||
        errorMessage?.includes('refresh_token_not_found')) {
      console.log('Session error, signing out...');
      setSession(null);
      await queryClient.resetQueries();
      localStorage.clear();
      await supabase.auth.signOut();
      
      toast({
        title: "Session expired",
        description: "Please sign in again",
        variant: "destructive",
      });

      window.location.href = '/login';
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeSession = async () => {
      try {
        setLoading(true);
        console.log('Checking for existing session...');
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted && existingSession?.user) {
          console.log('Found existing session for user:', existingSession.user.id);
          
          // Verify session is still valid with a test request
          const { error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          
          setSession(existingSession);
        }
      } catch (error: any) {
        console.error('Session check error:', error);
        if (mounted) {
          await handleAuthError(error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', _event, currentSession?.user?.id);
      
      if (_event === 'SIGNED_OUT') {
        console.log('User signed out, clearing session and queries');
        setSession(null);
        queryClient.resetQueries();
        localStorage.clear();
        window.location.href = '/login';
        return;
      }

      if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
        console.log('Setting session after', _event);
        setSession(currentSession);
        if (_event === 'SIGNED_IN') {
          queryClient.resetQueries();
        }
        return;
      }

      setSession(currentSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, toast]);

  return { session, loading };
};