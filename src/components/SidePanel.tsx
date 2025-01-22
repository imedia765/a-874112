import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Wallet,
  LogOut,
  Loader2
} from "lucide-react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

interface SidePanelProps {
  onTabChange: (tab: string) => void;
  userRole?: string;
}

const SidePanel = ({ onTabChange }: SidePanelProps) => {
  const { handleSignOut } = useAuthSession();
  const { userRole, userRoles, roleLoading, hasRole } = useRoleAccess();
  const { toast } = useToast();
  
  // Memoize navigation items to prevent recreating on every render
  const navigationItems = useMemo(() => [
    {
      name: 'Overview',
      icon: LayoutDashboard,
      tab: 'dashboard',
      alwaysShow: true
    },
    {
      name: 'Members',
      icon: Users,
      tab: 'users',
      requiresRole: ['admin', 'collector'] as UserRole[]
    },
    {
      name: 'Collectors & Financials',
      icon: Wallet,
      tab: 'financials',
      requiresRole: ['admin'] as UserRole[]
    },
    {
      name: 'System',
      icon: Settings,
      tab: 'system',
      requiresRole: ['admin'] as UserRole[]
    }
  ], []);

  // Memoize the shouldShowTab function with proper dependencies
  const shouldShowTab = useCallback((tab: string): boolean => {
    if (roleLoading) return tab === 'dashboard';
    if (!userRoles || !userRole) return tab === 'dashboard';

    switch (tab) {
      case 'dashboard':
        return true;
      case 'users':
        return hasRole('admin') || hasRole('collector');
      case 'financials':
        return hasRole('admin');
      case 'system':
        return hasRole('admin');
      default:
        return false;
    }
  }, [roleLoading, userRoles, userRole, hasRole]);

  // Memoize the handleTabChange function with proper dependencies
  const handleTabChange = useCallback((tab: string) => {
    if (roleLoading) {
      toast({
        title: "Please wait",
        description: "Loading access permissions...",
      });
      return;
    }

    const hasAccess = shouldShowTab(tab);
    if (hasAccess) {
      onTabChange(tab);
    } else {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this section.",
        variant: "destructive",
      });
    }
  }, [roleLoading, shouldShowTab, onTabChange, toast]);

  const handleLogoutClick = useCallback(async () => {
    try {
      await handleSignOut(false);
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error signing out",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  }, [handleSignOut, toast]);

  // Memoize the role status text
  const roleStatusText = useMemo(() => {
    if (roleLoading) return 'Loading access...';
    return userRole ? `Role: ${userRole}` : 'Access restricted';
  }, [roleLoading, userRole]);

  // Memoize the visible navigation items
  const visibleNavigationItems = useMemo(() => {
    return navigationItems.filter(item => 
      item.alwaysShow || (!roleLoading && item.requiresRole?.some(role => userRoles?.includes(role)))
    );
  }, [navigationItems, roleLoading, userRoles]);

  return (
    <div className="flex flex-col h-full bg-dashboard-card border-r border-dashboard-cardBorder">
      <div className="p-4 lg:p-6 border-b border-dashboard-cardBorder">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          Dashboard
          {roleLoading && <Loader2 className="h-4 w-4 animate-spin text-dashboard-accent1" />}
        </h2>
        <p className="text-sm text-dashboard-muted">
          {roleStatusText}
        </p>
      </div>
      
      <ScrollArea className="flex-1 px-4 lg:px-6">
        <div className="space-y-1.5 py-4">
          {visibleNavigationItems.map((item) => (
            <Button
              key={item.tab}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-2 text-sm font-medium",
                "hover:bg-dashboard-hover/10 hover:text-white",
                "transition-colors duration-200"
              )}
              onClick={() => handleTabChange(item.tab)}
              disabled={roleLoading}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 lg:p-6 border-t border-dashboard-cardBorder">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sm text-dashboard-muted hover:text-white hover:bg-dashboard-hover/10"
          onClick={handleLogoutClick}
          disabled={roleLoading}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default SidePanel;