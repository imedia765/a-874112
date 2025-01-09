import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlayCircle, AlertCircle, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DebugConsole } from '../logs/DebugConsole';
import SystemCheckProgress from './SystemCheckProgress';
import { toast } from "sonner";
import TestResultsTable from './test-runner/TestResultsTable';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const TestRunner = () => {
  const [testLogs, setTestLogs] = useState<string[]>(['Test runner initialized and ready']);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

  // Add console log to track test results
  console.log('Current test results:', testResults);

  const runAllTests = async () => {
    setIsRunning(true);
    setTestLogs(prev => [...prev, '🚀 Starting all tests...']);
    setProgress(0);
    
    try {
      const testFunctions = [
        { 
          name: 'System Performance', 
          fn: 'check_system_performance',
          type: 'performance'
        },
        { 
          name: 'Security Audit', 
          fn: 'audit_security_settings',
          type: 'security'
        },
        { 
          name: 'Configuration Check', 
          fn: 'validate_user_roles',
          type: 'configuration'
        },
        { 
          name: 'Member Numbers', 
          fn: 'check_member_numbers',
          type: 'system'
        }
      ] as const;

      const results = [];
      let completedTests = 0;

      for (const test of testFunctions) {
        setCurrentTest(`Running ${test.name}...`);
        setTestLogs(prev => [...prev, `📋 Starting ${test.name} test...`]);
        console.log(`Executing test: ${test.name}`); // Debug log

        const { data, error } = await supabase.rpc(test.fn);

        if (error) {
          console.error(`Test error for ${test.name}:`, error); // Debug log
          throw new Error(`${test.name} failed: ${error.message}`);
        }

        console.log(`Test results for ${test.name}:`, data); // Debug log

        const processedData = Array.isArray(data) ? data : [data];
        results.push(...processedData.map(item => ({
          ...item,
          test_type: test.type
        })));
        
        completedTests++;
        setProgress((completedTests / testFunctions.length) * 100);
        setTestLogs(prev => [...prev, `✅ ${test.name} completed`]);
      }

      console.log('All test results:', results); // Debug log
      setTestResults(results);
      setProgress(100);
      setCurrentTest('All tests complete');
      toast.success('All tests completed successfully');
      
      return results;
    } catch (error: any) {
      console.error('Test run error:', error);
      setTestLogs(prev => [...prev, `❌ Error running tests: ${error.message}`]);
      toast.error("Test run failed");
      throw error;
    } finally {
      setIsRunning(false);
    }
  };

  const runTestsMutation = useMutation({
    mutationFn: runAllTests,
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      setTestLogs(prev => [...prev, `❌ Error: ${error.message}`]);
      setProgress(0);
      setCurrentTest('Test run failed');
    }
  });

  useQuery({
    queryKey: ['test-logs'],
    queryFn: async () => {
      const channel = supabase
        .channel('test-logs')
        .on('broadcast', { event: 'test-log' }, ({ payload }) => {
          if (payload?.message) {
            setTestLogs(prev => [...prev, `📝 ${payload.message}`]);
          }
          if (payload?.progress) {
            setProgress(payload.progress);
          }
          if (payload?.currentTest) {
            setCurrentTest(payload.currentTest);
          }
        })
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    },
    enabled: isRunning
  });

  return (
    <Card className="bg-dashboard-card border-dashboard-cardBorder hover:border-dashboard-cardBorderHover transition-all duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PlayCircle className="w-6 h-6 text-dashboard-accent1" />
            <CardTitle className="text-xl font-medium text-dashboard-text">
              System Test Runner
            </CardTitle>
          </div>
          <Button
            onClick={() => runTestsMutation.mutate()}
            disabled={isRunning}
            className="bg-dashboard-accent1 hover:bg-dashboard-accent2 text-white transition-all duration-300"
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isRunning && (
          <div className="glass-card p-4 rounded-lg border border-dashboard-cardBorder bg-dashboard-card/50">
            <SystemCheckProgress
              currentCheck={currentTest}
              progress={progress}
              totalChecks={100}
              completedChecks={Math.floor(progress)}
            />
          </div>
        )}

        {runTestsMutation.isError && (
          <Alert variant="destructive" className="bg-dashboard-card border-dashboard-error">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Running Tests</AlertTitle>
            <AlertDescription>
              {runTestsMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        {testResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-dashboard-text">Test Results</h3>
              <Badge 
                variant="outline" 
                className="bg-dashboard-accent3/10 text-dashboard-accent3 border-dashboard-accent3/20"
              >
                {testResults.length} Tests Completed
              </Badge>
            </div>
            <div className="glass-card p-4 rounded-lg border border-dashboard-cardBorder bg-dashboard-card/50">
              <TestResultsTable 
                results={testResults} 
                type={testResults[0]?.test_type || 'system'} 
              />
            </div>
          </div>
        )}

        <Separator className="my-6 bg-dashboard-cardBorder" />
        
        <div className="glass-card p-4 rounded-lg border border-dashboard-cardBorder bg-dashboard-card/50">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-4 h-4 text-dashboard-accent2" />
            <h3 className="text-sm font-medium text-dashboard-text">Debug Console</h3>
          </div>
          <DebugConsole logs={testLogs} />
        </div>
      </CardContent>
    </Card>
  );
};

export default TestRunner;