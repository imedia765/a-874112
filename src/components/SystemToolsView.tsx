import { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import SystemHealthCheck from './system/SystemHealthCheck';
import RoleManagementCard from './system/RoleManagementCard';
import GitOperationsCard from './system/GitOperationsCard';
import TestRunner from './system/TestRunner';
import { Card } from './ui/card';
import LogsHeader from './logs/LogsHeader';
import { LogsTabs } from './logs/LogsTabs';
import { AuditLogsList } from './logs/AuditLogsList';
import MonitoringLogsList from './logs/MonitoringLogsList';
import { DebugConsole } from './logs/DebugConsole';
import { LOGS_TABS, LogsTabsType } from '@/constants/logs';
import { useState } from 'react';

const SystemToolsView = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LogsTabsType>(LOGS_TABS.AUDIT);
  const [debugLogs] = useState(['Debug logging initialized', 'Real-time subscriptions active']);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          console.error('Auth error:', error);
          toast({
            title: "Authentication Error",
            description: "Please sign in again",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        queryClient.invalidateQueries({ queryKey: ['security_audit'] });
        queryClient.invalidateQueries({ queryKey: ['member_number_check'] });
      } catch (error) {
        console.error('Session check error:', error);
        toast({
          title: "Session Error",
          description: "Please sign in again",
          variant: "destructive",
        });
        navigate('/login');
      }
    };
    checkAuth();
  }, [queryClient, toast, navigate]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-medium mb-2 text-white">System Tools</h1>
        <p className="text-dashboard-muted">Manage and monitor system health</p>
      </header>

      <div className="grid gap-6">
        <SystemHealthCheck />
        <TestRunner />
        <GitOperationsCard />
        <RoleManagementCard />
        
        <Card className="dashboard-card">
          <LogsHeader 
            title="System Logs"
            subtitle="View and manage system audit and monitoring logs"
          />
          
          <div className="mt-6">
            <LogsTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <div className="mt-4">
              {activeTab === LOGS_TABS.AUDIT && <AuditLogsList />}
              {activeTab === LOGS_TABS.MONITORING && <MonitoringLogsList />}
            </div>
            
            <div className="mt-6">
              <DebugConsole logs={debugLogs} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemToolsView;