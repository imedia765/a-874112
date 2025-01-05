import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { AlertOctagon, Database, Shield, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface AuditResult {
  check_type: string;
  status: string;
  details: any;
}

interface MemberNumberIssue {
  issue_type: string;
  description: string;
  affected_table: string;
  member_number: string;
  details: any;
}

const SystemToolsView = () => {
  const { toast } = useToast();
  const [isCheckingMembers, setIsCheckingMembers] = useState(false);
  const [isAuditingSecurity, setIsAuditingSecurity] = useState(false);

  // Query for member number checks
  const { data: memberIssues, refetch: refetchMemberIssues } = useQuery({
    queryKey: ['member_number_checks'],
    queryFn: async () => {
      console.log('Checking member numbers...');
      const { data, error } = await supabase.rpc('check_member_numbers');
      if (error) {
        console.error('Error checking member numbers:', error);
        throw error;
      }
      return data as MemberNumberIssue[];
    },
    enabled: false,
  });

  // Query for security audit
  const { data: securityAudit, refetch: refetchSecurityAudit } = useQuery({
    queryKey: ['security_audit'],
    queryFn: async () => {
      console.log('Running security audit...');
      const { data, error } = await supabase.rpc('audit_security_settings');
      if (error) {
        console.error('Error running security audit:', error);
        throw error;
      }
      return data as AuditResult[];
    },
    enabled: false,
  });

  const handleCheckMembers = async () => {
    setIsCheckingMembers(true);
    try {
      await refetchMemberIssues();
      toast({
        title: "Member Check Complete",
        description: "Member number verification has been completed.",
      });
    } catch (error: any) {
      toast({
        title: "Error Checking Members",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCheckingMembers(false);
    }
  };

  const handleSecurityAudit = async () => {
    setIsAuditingSecurity(true);
    try {
      await refetchSecurityAudit();
      toast({
        title: "Security Audit Complete",
        description: "Security settings have been audited.",
      });
    } catch (error: any) {
      toast({
        title: "Error Running Security Audit",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAuditingSecurity(false);
    }
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-medium mb-2 text-white">System Tools</h1>
        <p className="text-dashboard-text">Manage and audit system settings</p>
      </header>

      <div className="space-y-8">
        {/* Member Number Verification Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-white flex items-center gap-2">
              <Database className="w-5 h-5" />
              Member Number Verification
            </h2>
            <Button 
              onClick={handleCheckMembers} 
              disabled={isCheckingMembers}
            >
              Run Check
            </Button>
          </div>

          {memberIssues && memberIssues.length > 0 ? (
            <div className="space-y-4">
              {memberIssues.map((issue, index) => (
                <Alert 
                  key={index}
                  variant={issue.issue_type === 'Duplicate Member Number' ? 'destructive' : 'default'}
                >
                  <AlertOctagon className="h-4 w-4" />
                  <AlertTitle>{issue.issue_type}</AlertTitle>
                  <AlertDescription>
                    <p>{issue.description}</p>
                    <p className="mt-2">
                      <strong>Table:</strong> {issue.affected_table}<br />
                      <strong>Member Number:</strong> {issue.member_number}
                    </p>
                    <pre className="mt-2 p-2 bg-black/10 rounded text-sm">
                      {JSON.stringify(issue.details, null, 2)}
                    </pre>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : memberIssues?.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>All Clear</AlertTitle>
              <AlertDescription>
                No member number issues were found.
              </AlertDescription>
            </Alert>
          ) : null}
        </section>

        {/* Security Audit Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Audit
            </h2>
            <Button 
              onClick={handleSecurityAudit}
              disabled={isAuditingSecurity}
            >
              Run Audit
            </Button>
          </div>

          {securityAudit && securityAudit.length > 0 ? (
            <div className="space-y-4">
              {securityAudit.map((result, index) => (
                <Alert 
                  key={index}
                  variant={result.status === 'Critical' ? 'destructive' : 'default'}
                >
                  <AlertOctagon className="h-4 w-4" />
                  <AlertTitle>{result.check_type}</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">Status: {result.status}</p>
                    <pre className="p-2 bg-black/10 rounded text-sm">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : securityAudit?.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>All Clear</AlertTitle>
              <AlertDescription>
                No security issues were found.
              </AlertDescription>
            </Alert>
          ) : null}
        </section>
      </div>
    </>
  );
};

export default SystemToolsView;