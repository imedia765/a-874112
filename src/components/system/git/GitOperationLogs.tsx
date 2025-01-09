import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Copy, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface GitOperationLog {
  id: string;
  operation_type: string;
  status: string;
  message: string;
  created_at: string;
  error_details?: string;
}

interface GitOperationLogsProps {
  logs: GitOperationLog[];
}

export const GitOperationLogs = ({ logs: initialLogs }: GitOperationLogsProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState(initialLogs);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  useEffect(() => {
    const channel = supabase
      .channel('git-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'git_operations_logs'
        },
        (payload) => {
          console.log('Received real-time update:', payload);
          if (payload.eventType === 'INSERT') {
            setLogs(prev => [payload.new as GitOperationLog, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setLogs(prev => 
              prev.map(log => 
                log.id === payload.new.id ? payload.new as GitOperationLog : log
              )
            );
          }
          // Auto-scroll to the latest log
          if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = 0;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getFormattedLogs = () => {
    return logs.map(log => (
      `Operation: ${log.operation_type}
Status: ${log.status}
Time: ${new Date(log.created_at).toLocaleString()}
Message: ${log.message}
${log.error_details ? `Error Details: ${log.error_details}` : ''}
-------------------`
    )).join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFormattedLogs());
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Logs have been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-dashboard-accent1" />
          <h3 className="text-sm font-medium text-white">Git Operation Logs</h3>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-dashboard-accent1 hover:bg-dashboard-accent1/80 text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy Logs'}
        </button>
      </div>
      <ScrollArea 
        ref={scrollAreaRef}
        className="h-[300px] rounded-md border border-dashboard-cardBorder bg-dashboard-card"
      >
        <div className="p-4 space-y-3 font-mono text-sm">
          {logs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded bg-dashboard-card/50 border transition-colors ${
                log.status === 'failed' 
                  ? 'border-dashboard-error/30 hover:border-dashboard-error/50' 
                  : 'border-dashboard-cardBorder hover:border-dashboard-cardBorderHover'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-dashboard-accent1 font-semibold">
                  {log.operation_type}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  log.status === 'completed' ? 'bg-dashboard-success/20 text-dashboard-success' :
                  log.status === 'failed' ? 'bg-dashboard-error/20 text-dashboard-error' :
                  'bg-dashboard-warning/20 text-dashboard-warning'
                }`}>
                  {log.status}
                </span>
              </div>
              <p className={`mb-1 ${log.status === 'failed' ? 'text-dashboard-error' : 'text-dashboard-text'}`}>
                {log.message}
              </p>
              {log.error_details && (
                <p className="text-dashboard-error text-xs mt-1 bg-dashboard-error/10 p-2 rounded">
                  Error: {log.error_details}
                </p>
              )}
              <p className="text-dashboard-muted text-xs mt-2">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-dashboard-muted text-center py-4">
              No git operation logs available
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};