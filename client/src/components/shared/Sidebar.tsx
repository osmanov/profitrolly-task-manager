import { Briefcase, Plus, Settings, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUnsavedChangesContext } from "@/contexts/UnsavedChangesContext";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { notifications } = useNotifications();
  const isMobile = useIsMobile();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingPath, setPendingPath] = useState("");
  const { hasUnsavedChanges, setHasUnsavedChanges } = useUnsavedChangesContext();
  
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;
  
  const handleNavigateToNew = () => {
    if (hasUnsavedChanges) {
      setPendingPath('/portfolios/new');
      setShowConfirmDialog(true);
    } else {
      setLocation('/portfolios/new');
    }
  };
  
  const handleConfirmNavigation = () => {
    setHasUnsavedChanges(false);
    setLocation(pendingPath);
    setShowConfirmDialog(false);
    setPendingPath("");
  };
  
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
    if (path === "/notifications" && location === "/notifications") {
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
    <aside className="w-64 bg-card shadow-lg min-h-screen hidden md:block" data-testid="sidebar">
      <nav className="p-4 space-y-2">
        <Link href="/portfolios">
          <button className={linkClass("/portfolios")} data-testid="sidebar-portfolios">
            <Briefcase className="h-4 w-4 mr-3" />
            Мои Портфолио
          </button>
        </Link>
        
        <button 
          className={linkClass("/portfolios/new")} 
          onClick={handleNavigateToNew}
          data-testid="sidebar-new-portfolio"
        >
          <Plus className="h-4 w-4 mr-3" />
          Новое Portfolio
        </button>
        
        <Link href="/notifications">
          <button className={linkClass("/notifications")} data-testid="sidebar-notifications">
            <Bell className="h-4 w-4 mr-3" />
            Уведомления
            {unreadCount > 0 && (
              <Badge className="ml-auto bg-red-500 text-white text-xs px-2 py-1">
                {unreadCount}
              </Badge>
            )}
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
      
      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Несохранённые изменения"
        description="У вас есть несохранённые изменения. Вы уверены, что хотите покинуть эту страницу?"
        onConfirm={handleConfirmNavigation}
      />
    </aside>
  );
}
