import { Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";

interface RoleSelectProps {
  currentRole: Database['public']['Enums']['app_role'];
  onRoleChange: (role: Database['public']['Enums']['app_role']) => void;
}

const RoleSelect = ({ currentRole, onRoleChange }: RoleSelectProps) => {
  return (
    <Select
      value={currentRole}
      onValueChange={onRoleChange}
    >
      <SelectTrigger className="w-[140px] bg-dashboard-card border-dashboard-accent1/20 text-dashboard-text">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-dashboard-card border-white/10">
        <SelectItem value="admin" className="text-dashboard-text">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-dashboard-accent1" />
            Admin
          </div>
        </SelectItem>
        <SelectItem value="collector" className="text-dashboard-text">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-dashboard-accent2" />
            Collector
          </div>
        </SelectItem>
        <SelectItem value="member" className="text-dashboard-text">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-dashboard-accent3" />
            Member
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default RoleSelect;