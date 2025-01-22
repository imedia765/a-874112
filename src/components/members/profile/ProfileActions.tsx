import { Button } from "@/components/ui/button";
import { Edit, PhoneCall } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import BankDetails from "../payment/BankDetails";

interface ProfileActionsProps {
  userRole: string;
  onEditClick: () => void;
  onPaymentClick?: () => void;  // Made optional since not all roles need it
  collectorInfo?: {
    name?: string | null;
    phone?: string | null;
  };
  memberNumber?: string;
}

const ProfileActions = ({ 
  userRole, 
  onEditClick,
  onPaymentClick,
  collectorInfo,
  memberNumber
}: ProfileActionsProps) => {
  return (
    <div className="space-y-4">
      {(userRole === 'collector' || userRole === 'admin' || userRole === 'member') && (
        <Button
          onClick={onEditClick}
          variant="outline"
          className="w-full border-dashboard-accent2/50 hover:bg-dashboard-accent2/10"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      )}
      
      {userRole === 'member' && collectorInfo ? (
        <div className="space-y-4">
          <Alert className="bg-dashboard-accent1/10 border-dashboard-accent1/20">
            <AlertDescription className="text-dashboard-text">
              Please contact your collector to make a payment:
              <div className="mt-2 font-medium">
                {collectorInfo.name && <p>Collector: {collectorInfo.name}</p>}
                {collectorInfo.phone && <p>Phone: {collectorInfo.phone}</p>}
              </div>
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => {
              if (collectorInfo.phone) {
                window.location.href = `tel:${collectorInfo.phone}`;
              }
            }}
            className="w-full bg-dashboard-accent3 hover:bg-dashboard-accent3/80 text-white transition-colors"
            disabled={!collectorInfo.phone}
          >
            <PhoneCall className="w-4 h-4 mr-2" />
            Call Collector
          </Button>
          <div className="mt-6">
            <BankDetails memberNumber={memberNumber} />
          </div>
        </div>
      ) : (
        userRole === 'admin' && onPaymentClick && (
          <>
            <Button
              onClick={onPaymentClick}
              className="w-full bg-dashboard-accent1 hover:bg-dashboard-accent1/80 text-white transition-colors"
            >
              <PhoneCall className="w-4 h-4 mr-2" />
              Make Payment
            </Button>
            <div className="mt-6">
              <BankDetails memberNumber={memberNumber} />
            </div>
          </>
        )
      )}

      {userRole === 'collector' && (
        <div className="mt-6">
          <BankDetails memberNumber={memberNumber} />
        </div>
      )}
    </div>
  );
};

export default ProfileActions;