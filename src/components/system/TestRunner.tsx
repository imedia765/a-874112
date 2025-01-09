import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlayCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DebugConsole } from '../logs/DebugConsole';
import SystemCheckProgress from './SystemCheckProgress';
import { toast } from "sonner";
import TestResultsTable from './test-runner/TestResultsTable';

const TestRunner = () => {
  const [testLogs, setTestLogs] = useState<string[]>(['Test runner initialized and ready']);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [testResults, setTestResults] = useState<any[]>([]);

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

        const { data, error } = await supabase.rpc(test.fn);

        if (error) {
          throw new Error(`${test.name} failed: ${error.message}`);
        }

        const processedData = Array.isArray(data) ? data : [data];
        results.push(...processedData.map(item => ({
          ...item,
          test_type: test.type
        })));
        
        completedTests++;
        setProgress((completedTests / testFunctions.length) * 100);
        setTestLogs(prev => [...prev, `✅ ${test.name} completed`]);
      }

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
    <section className="space-y-4 dashboard-card">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-dashboard-text flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-dashboard-accent1" />
          Test Runner
        </h2>
      </div>

      <Button
        onClick={() => runTestsMutation.mutate()}
        disabled={isRunning}
        className="bg-dashboard-accent1 hover:bg-dashboard-accent2 text-white"
      >
        {isRunning ? 'Running Tests...' : 'Run All Tests'}
      </Button>

      {isRunning && (
        <SystemCheckProgress
          currentCheck={currentTest}
          progress={progress}
          totalChecks={100}
          completedChecks={Math.floor(progress)}
        />
      )}

      {runTestsMutation.isError && (
        <Alert variant="destructive" className="bg-dashboard-card border-dashboard-error">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to run tests: {runTestsMutation.error.message}
          </AlertDescription>
        </Alert>
      )}

      {testResults.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-dashboard-text mb-4">Test Results</h3>
          <TestResultsTable 
            results={testResults} 
            type={testResults[0]?.test_type || 'system'} 
          />
        </div>
      )}

      <DebugConsole logs={testLogs} />
    </section>
  );
};

export default TestRunner;