import NotificationsList from "@/components/notifications/NotificationsList";

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="page-title-notifications">
            Уведомления
          </h1>
          <p className="text-gray-600 mt-1">
            Управляйте приглашениями и получайте обновления о совместных портфолио
          </p>
        </div>
        
        <NotificationsList />
      </div>
    </div>
  );
}