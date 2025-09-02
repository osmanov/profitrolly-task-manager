import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";

export default function Header() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/portfolios" && (location === "/" || location.startsWith("/portfolios"))) {
      return true;
    }
    return location === path;
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/portfolios">
            <h1 className="text-2xl font-bold text-primary cursor-pointer" data-testid="text-app-title">
              profiTrolly
            </h1>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link href="/portfolios">
              <button
                className={`transition-colors ${
                  isActive("/portfolios")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
                data-testid="nav-portfolios"
              >
                Portfolios
              </button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/settings">
                <button
                  className={`transition-colors ${
                    isActive("/settings")
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  data-testid="nav-settings"
                >
                  Settings
                </button>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground" data-testid="text-user-name">
            {user?.fullName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
