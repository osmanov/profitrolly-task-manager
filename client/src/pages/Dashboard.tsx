import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/shared/Header";
import Sidebar from "@/components/shared/Sidebar";

interface DashboardProps {
  children: React.ReactNode;
}

export default function Dashboard({ children }: DashboardProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6" data-testid="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
