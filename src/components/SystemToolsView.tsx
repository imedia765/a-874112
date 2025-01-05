import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import MemberNumberVerification from './system/MemberNumberVerification';
import SecurityAudit from './system/SecurityAudit';

const SystemToolsView = () => {
  const { toast } = useToast();
  const [isCheckingMembers, setIsCheckingMembers] = useState(false);
  const [isAuditingSecurity, setIsAuditingSecurity] = useState(false);

  const handleCheckComplete = (success: boolean) => {
    toast({
      title: success ? "Member Check Complete" : "Error Checking Members",
      description: success 
        ? "Member number verification has been completed."
        : "An error occurred while checking members.",
      variant: success ? "default" : "destructive",
    });
  };

  const handleAuditComplete = (success: boolean) => {
    toast({
      title: success ? "Security Audit Complete" : "Error Running Security Audit",
      description: success 
        ? "Security settings have been audited."
        : "An error occurred while running the security audit.",
      variant: success ? "default" : "destructive",
    });
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-medium mb-2 text-white">System Tools</h1>
        <p className="text-dashboard-text">Manage and audit system settings</p>
      </header>

      <div className="space-y-8">
        <MemberNumberVerification 
          isCheckingMembers={isCheckingMembers}
          setIsCheckingMembers={setIsCheckingMembers}
          onCheckComplete={handleCheckComplete}
        />
        
        <SecurityAudit
          isAuditingSecurity={isAuditingSecurity}
          setIsAuditingSecurity={setIsAuditingSecurity}
          onAuditComplete={handleAuditComplete}
        />
      </div>
    </>
  );
};

export default SystemToolsView;