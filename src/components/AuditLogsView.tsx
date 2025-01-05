import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { AuditLog } from '@/types/audit';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const AuditLogsView = () => {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  const addDebugLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: async () => {
      console.log('Fetching audit logs...');
      addDebugLog('Fetching initial audit logs');
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching audit logs:', error);
        addDebugLog(`Error fetching audit logs: ${error.message}`);
        throw error;
      }

      addDebugLog(`Fetched ${data?.length || 0} audit logs`);
      return data as AuditLog[];
    },
  });

  useEffect(() => {
    addDebugLog('Setting up real-time subscription');
    const channel = supabase
      .channel('audit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          addDebugLog(`Real-time update received: ${payload.eventType}`);
          // Force a refetch when we receive updates
          window.location.reload();
        }
      )
      .subscribe((status) => {
        addDebugLog(`Subscription status: ${status}`);
      });

    return () => {
      addDebugLog('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'bg-blue-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'critical':
        return 'bg-red-700';
      default:
        return 'bg-gray-500';
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'create':
        return 'bg-green-500';
      case 'update':
        return 'bg-blue-500';
      case 'delete':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return <div className="text-white">Loading audit logs...</div>;
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-medium mb-2 text-white">Audit Logs</h1>
        <p className="text-dashboard-text">View system activity and changes</p>
      </header>

      <div className="space-y-6">
        <div className="glass-card p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Changes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-dashboard-text">
                    {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getOperationColor(log.operation)}`}>
                      {log.operation}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-dashboard-text">
                    {log.table_name}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getSeverityColor(log.severity)}`}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-dashboard-text max-w-md truncate">
                    {log.operation === 'update' && (
                      <span>
                        Changed: {Object.keys(log.new_values || {}).join(', ')}
                      </span>
                    )}
                    {log.operation === 'create' && 'New record created'}
                    {log.operation === 'delete' && 'Record deleted'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-xl font-medium mb-4 text-white">Debug Console</h2>
          <ScrollArea className="h-[200px] rounded-md border border-white/10 bg-black/20">
            <div className="p-4 space-y-2">
              {debugLogs.map((log, index) => (
                <div key={index} className="text-sm font-mono text-dashboard-text">
                  {log}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </>
  );
};

export default AuditLogsView;