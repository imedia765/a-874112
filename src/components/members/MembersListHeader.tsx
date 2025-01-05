import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface MembersListHeaderProps {
  userRole: string | null;
  onPrint: () => void;
  hasMembers: boolean;
  collectorInfo?: { name: string } | null;
}

const MembersListHeader = ({ userRole, onPrint, hasMembers, collectorInfo }: MembersListHeaderProps) => {
  if (userRole !== 'collector' || !hasMembers) return null;

  return (
    <div className="flex justify-end mb-4">
      <Button
        onClick={onPrint}
        className="flex items-center gap-2 bg-dashboard-accent1 hover:bg-dashboard-accent1/80"
      >
        <Printer className="w-4 h-4" />
        Print Members List
      </Button>
    </div>
  );
};

export default MembersListHeader;