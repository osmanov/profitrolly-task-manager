import { LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Header() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const isActive = (path: string) => {
    if (path === "/portfolios" && (location === "/" || location.startsWith("/portfolios"))) {
      return true;
    }
    return location === path;
  };

  return (
    <header className="bg-blue-600 border-b border-blue-300 px-4 sm:px-6 py-4 shadow-lg" data-testid="header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white hover:bg-white/10 p-2 md:hidden"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          <Link href="/portfolios">
            <h1 className="text-xl sm:text-2xl font-bold text-white cursor-pointer drop-shadow-sm" data-testid="text-app-title">
              profiTrolly
            </h1>
          </Link>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/portfolios">
              <button
                className={`transition-colors font-medium ${
                  isActive("/portfolios")
                    ? "text-white bg-white/20 px-3 py-2 rounded-md"
                    : "text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md"
                }`}
                data-testid="nav-portfolios"
              >
                Портфолио
              </button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/settings">
                <button
                  className={`transition-colors font-medium ${
                    isActive("/settings")
                      ? "text-white bg-white/20 px-3 py-2 rounded-md"
                      : "text-white/80 hover:text-white hover:bg-white/10 px-3 py-2 rounded-md"
                  }`}
                  data-testid="nav-settings"
                >
                  Настройки
                </button>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <span className="hidden sm:block text-sm text-white/90 font-medium" data-testid="text-user-name">
            {user?.fullName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-white/80 hover:text-white hover:bg-white/10"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Выйти</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile navigation menu */}
      {isMobile && mobileMenuOpen && (
        <div className="md:hidden border-t border-blue-500 mt-4 pt-4">
          <nav className="space-y-2">
            <Link href="/portfolios">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors font-medium ${
                  isActive("/portfolios")
                    ? "text-white bg-white/20"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
                data-testid="mobile-nav-portfolios"
              >
                Портфолио
              </button>
            </Link>
            {user?.role === "admin" && (
              <Link href="/settings">
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors font-medium ${
                    isActive("/settings")
                      ? "text-white bg-white/20"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                  data-testid="mobile-nav-settings"
                >
                  Настройки
                </button>
              </Link>
            )}
            <div className="border-t border-blue-500 pt-2 mt-2">
              <div className="px-3 py-2 text-sm text-white/90">
                {user?.fullName}
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
