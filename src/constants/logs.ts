export const LOGS_TABS = {
  AUDIT: 'audit' as const,
  MONITORING: 'monitoring' as const
} as const;

export type LogsTabsType = typeof LOGS_TABS[keyof typeof LOGS_TABS];