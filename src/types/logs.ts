export type LogTab = 'audit' | 'monitoring';

export interface MonitoringLog {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  operation: 'create' | 'update' | 'delete';
  table_name: string;
  record_id: string;
  details: string;
}