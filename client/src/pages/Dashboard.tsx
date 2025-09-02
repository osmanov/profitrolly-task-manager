import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/shared/Header";
import Sidebar from "@/components/shared/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardProps {
  children: React.ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`} data-testid="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
