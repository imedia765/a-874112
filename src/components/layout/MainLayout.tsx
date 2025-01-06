import { ReactNode } from 'react';
import MainHeader from './MainHeader';
import SidePanel from '@/components/SidePanel';
import { UserRole } from '@/hooks/useRoleAccess';

interface MainLayoutProps {
  children: ReactNode;
  activeTab: string;
  userRole: UserRole;  // Updated type to use UserRole instead of string | null
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  onTabChange: (tab: string) => void;
}

const MainLayout = ({
  children,
  activeTab,
  userRole,
  isSidebarOpen,
  onSidebarToggle,
  onTabChange,
}: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-dashboard-dark">
      <MainHeader onToggleSidebar={onSidebarToggle} />
      
      <div className="flex h-screen pt-16">
        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onSidebarToggle}
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
              onTabChange(tab);
              onSidebarToggle();
            }}
            userRole={userRole}
          />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] p-8 lg:pl-8 overflow-auto">
          <div className="max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;