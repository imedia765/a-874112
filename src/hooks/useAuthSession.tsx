import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";

export const useAuthSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAuthError = async (error: any) => {
    console.error('Auth error:', error);
    
    const errorMessage = typeof error === 'string' ? error : error.message || error.error_description;
    
    if (errorMessage?.includes('session_not_found') || 
        errorMessage?.includes('JWT expired') ||
        errorMessage?.includes('Invalid Refresh Token') ||
        errorMessage?.includes('refresh_token_not_found')) {
      console.log('Invalid or expired session, signing out...');
      
      // Clear session state immediately
      setSession(null);
      
      // Reset all queries
      await queryClient.resetQueries();
      
      // Clear local storage
      localStorage.clear();
      
      // Clear supabase session
      await supabase.auth.signOut();
      
      toast({
        title: "Session expired",
        description: "Please sign in again",
        variant: "destructive",
      });

      // Force navigation to login
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted) {
          if (session?.user) {
            console.log('Initial session check:', session.user.id);
            // Verify the session is still valid
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            
            if (!user) {
              throw new Error('User not found');
            }
          }
          setSession(session);
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Session check error:', error);
        if (mounted) {
          await handleAuthError(error);
          setLoading(false);
        }
      }
    };

    initializeSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', _event, session?.user?.id);
      
      if (_event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }

      if (_event === 'SIGNED_OUT') {
        console.log('User signed out, clearing session and queries');
        // Clear session immediately
        setSession(null);
        // Reset all queries
        queryClient.resetQueries();
        // Clear local storage
        localStorage.clear();
        // Force navigation to login
        window.location.href = '/login';
        return;
      }

      if (_event === 'SIGNED_IN') {
        // Ensure we have a valid user before setting the session
        try {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          
          if (!user) {
            throw new Error('User not found');
          }
          setSession(session);
          // Reset queries to fetch fresh data
          queryClient.resetQueries();
        } catch (error) {
          console.error('Sign in verification error:', error);
          await handleAuthError(error);
        }
        return;
      }

      // For all other events, update the session if valid
      try {
        if (session?.user) {
          // Verify the session is still valid
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) throw userError;
          
          if (!user) {
            throw new Error('User not found');
          }
        }
        setSession(session);
      } catch (error) {
        console.error('Session verification error:', error);
        await handleAuthError(error);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, toast]);

  return { session, loading };
};