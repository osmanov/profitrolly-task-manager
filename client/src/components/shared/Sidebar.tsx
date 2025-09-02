import { Briefcase, Plus, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Hide sidebar on mobile devices
  if (isMobile) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === "/portfolios" && (location === "/" || location === "/portfolios")) {
      return true;
    }
    if (path === "/portfolios/new" && location === "/portfolios/new") {
      return true;
    }
    return location === path;
  };

  const linkClass = (path: string) =>
    `w-full text-left px-3 py-2 rounded-md transition-colors flex items-center ${
      isActive(path)
        ? "bg-accent text-accent-foreground"
        : "hover:bg-accent hover:text-accent-foreground"
    }`;

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen hidden md:block" data-testid="sidebar">
      <nav className="p-4 space-y-2">
        <Link href="/portfolios">
          <button className={linkClass("/portfolios")} data-testid="sidebar-portfolios">
            <Briefcase className="h-4 w-4 mr-3" />
            Мои Портфолио
          </button>
        </Link>
        
        <Link href="/portfolios/new">
          <button className={linkClass("/portfolios/new")} data-testid="sidebar-new-portfolio">
            <Plus className="h-4 w-4 mr-3" />
            Новое Portfolio
          </button>
        </Link>

        {user?.role === "admin" && (
          <>
            <hr className="my-4 border-border" />
            <Link href="/settings">
              <button className={linkClass("/settings")} data-testid="sidebar-settings">
                <Settings className="h-4 w-4 mr-3" />
                Настройки системы
              </button>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
