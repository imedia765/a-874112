import { Menu } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MainHeaderProps {
  onToggleSidebar: () => void;
}

const MainHeader = ({ onToggleSidebar }: MainHeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-dashboard-card/50 backdrop-blur-sm py-4 px-6 border-b border-white/10">
      <div className="flex items-center justify-between lg:justify-center max-w-screen-2xl mx-auto">
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden bg-dashboard-card/50 border-white/10"
        >
          <Menu className="h-4 w-4" />
        </Button>

        <div className="text-center">
          <p className="text-xl text-white font-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p className="text-sm text-dashboard-accent1 mt-1">
            In the name of Allah, the Most Gracious, the Most Merciful
          </p>
        </div>
      </div>
    </header>
  );
};

export default MainHeader;