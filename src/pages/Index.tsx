import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import DashboardView from '@/components/DashboardView';
import MembersList from '@/components/MembersList';
import MemberSearch from '@/components/MemberSearch';
import CollectorsList from '@/components/CollectorsList';
import AuditLogsView from '@/components/AuditLogsView';
import SystemToolsView from '@/components/SystemToolsView';
import SidePanel from '@/components/SidePanel';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useToast } from "@/hooks/use-toast";
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userRole, roleLoading, canAccessTab } = useRoleAccess();
  const queryClient = useQueryClient();

  const handleSessionError = async () => {
    console.log('Session error detected, cleaning up...');
    
    try {
      // Clear all queries
      await queryClient.invalidateQueries();
      await queryClient.resetQueries();
      
      // Clear local storage
      localStorage.clear();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      toast({
        title: "Session expired",
        description: "Please sign in again",
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Cleanup error:', error);
      window.location.href = '/login';
    }
  };

  const checkAuth = async () => {
    try {
      console.log('Checking authentication status...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth check error:', error);
        await handleSessionError();
        return;
      }

      if (!session) {
        console.log('No active session found, redirecting to login...');
        await handleSessionError();
        return;
      }

      // Verify the session is still valid by making a test request
      const { error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User verification failed:', userError);
        await handleSessionError();
        return;
      }

      console.log('Active session found for user:', session.user.id);
    } catch (error: any) {
      console.error('Authentication check failed:', error);
      await handleSessionError();
    }
  };

  useEffect(() => {
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        await handleSessionError();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!roleLoading && !canAccessTab(activeTab)) {
      setActiveTab('dashboard');
      toast({
        title: "Access Restricted",
        description: "You don't have permission to access this section.",
        variant: "destructive",
      });
    }
  }, [activeTab, roleLoading, userRole]);

  const renderContent = () => {
    if (!canAccessTab(activeTab)) {
      return <DashboardView />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'users':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2 text-white">Members</h1>
              <p className="text-dashboard-muted">View and manage member information</p>
            </header>
            <MemberSearch 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
            <MembersList searchTerm={searchTerm} userRole={userRole} />
          </>
        );
      case 'collectors':
        return (
          <>
            <header className="mb-8">
              <h1 className="text-3xl font-medium mb-2 text-white">Collectors</h1>
              <p className="text-dashboard-muted">View and manage collector information</p>
            </header>
            <CollectorsList />
          </>
        );
      case 'audit':
        return <AuditLogsView />;
      case 'system':
        return <SystemToolsView />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-dark">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-dashboard-card/50 backdrop-blur-sm py-4 px-6 border-b border-white/10">
        <div className="flex items-center justify-between lg:justify-center max-w-screen-2xl mx-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden bg-dashboard-card/50 border-white/10"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <div className="text-center">
            <p className="text-xl text-white font-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="text-sm text-dashboard-accent1 mt-1">In the name of Allah, the Most Gracious, the Most Merciful</p>
          </div>
        </div>
      </header>
      
      {/* Main layout */}
      <div className="flex h-screen pt-16">
        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static w-64 h-[calc(100vh-4rem)] top-16
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-200 ease-in-out
          z-40
        `}>
          <SidePanel 
            onTabChange={(tab) => {
              setActiveTab(tab);
              setIsSidebarOpen(false);
            }}
            userRole={userRole}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-8 lg:pl-8 overflow-auto">
          <div className="max-w-screen-2xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;