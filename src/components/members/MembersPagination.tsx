import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MembersPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MembersPagination = ({ currentPage, totalPages, onPageChange }: MembersPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-4 mt-6 pb-4">
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="bg-dashboard-card border-white/10"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-dashboard-text">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="bg-dashboard-card border-white/10"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MembersPagination;