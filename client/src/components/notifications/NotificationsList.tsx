import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Bell, Check, X, Users, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useNotifications,
  useMarkNotificationAsRead,
  useDeleteNotification,
  useAcceptCollaborationFromNotification,
  useDeclineCollaborationFromNotification,
  type Notification,
} from "@/hooks/useNotifications";

export default function NotificationsList() {
  const { notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const deleteNotification = useDeleteNotification();
  const acceptCollaboration = useAcceptCollaborationFromNotification();
  const declineCollaboration = useDeclineCollaborationFromNotification();

  const handleAcceptInvite = (notificationId: string) => {
    acceptCollaboration.mutate(notificationId);
  };

  const handleDeclineInvite = (notificationId: string) => {
    declineCollaboration.mutate(notificationId);
  };

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification.mutate(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'collaboration_invite':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'collaboration_accepted':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'collaboration_declined':
        return <X className="h-5 w-5 text-red-600" />;
      default:
        return <MessageCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'collaboration_invite':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'collaboration_accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'collaboration_declined':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Уведомления</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  const readNotifications = notifications?.filter(n => n.isRead) || [];

  return (
    <Card data-testid="notifications-list">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Уведомления</CardTitle>
            {unreadNotifications.length > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadNotifications.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-8" data-testid="no-notifications">
            <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет уведомлений</h3>
            <p className="text-muted-foreground">У вас пока нет новых уведомлений</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unread notifications */}
            {unreadNotifications.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Новые</h4>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onAccept={handleAcceptInvite}
                      onDecline={handleDeclineInvite}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                      getIcon={getNotificationIcon}
                      getBadgeColor={getNotificationBadgeColor}
                      isUnread={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Read notifications */}
            {readNotifications.length > 0 && (
              <div>
                {unreadNotifications.length > 0 && <hr className="my-4" />}
                <h4 className="text-sm font-medium text-gray-600 mb-3">Прочитанные</h4>
                <div className="space-y-3">
                  {readNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onAccept={handleAcceptInvite}
                      onDecline={handleDeclineInvite}
                      onMarkAsRead={handleMarkAsRead}
                      onDelete={handleDelete}
                      getIcon={getNotificationIcon}
                      getBadgeColor={getNotificationBadgeColor}
                      isUnread={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface NotificationCardProps {
  notification: Notification;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  getIcon: (type: string) => JSX.Element;
  getBadgeColor: (type: string) => string;
  isUnread: boolean;
}

function NotificationCard({
  notification,
  onAccept,
  onDecline,
  onMarkAsRead,
  onDelete,
  getIcon,
  getBadgeColor,
  isUnread,
}: NotificationCardProps) {
  const data = notification.data ? JSON.parse(notification.data) : {};

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        isUnread ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
      }`}
      data-testid={`notification-${notification.id}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900">
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2">
              <Badge className={`text-xs ${getBadgeColor(notification.type)}`}>
                {notification.type === 'collaboration_invite' && 'Приглашение'}
                {notification.type === 'collaboration_accepted' && 'Принято'}
                {notification.type === 'collaboration_declined' && 'Отклонено'}
              </Badge>
              {isUnread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">
            {notification.message}
          </p>
          
          <p className="text-xs text-gray-500 mb-3">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ru,
            })}
          </p>

          {/* Action buttons for collaboration invites */}
          {notification.type === 'collaboration_invite' && isUnread && (
            <div className="flex items-center space-x-2 mb-2">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onAccept(notification.id)}
                data-testid={`button-accept-${notification.id}`}
              >
                <Check className="h-3 w-3 mr-1" />
                Принять
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-100"
                onClick={() => onDecline(notification.id)}
                data-testid={`button-decline-${notification.id}`}
              >
                <X className="h-3 w-3 mr-1" />
                Отклонить
              </Button>
            </div>
          )}

          {/* General notification actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isUnread && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onMarkAsRead(notification.id)}
                  className="text-blue-600 hover:bg-blue-100"
                  data-testid={`button-mark-read-${notification.id}`}
                >
                  Отметить как прочитанное
                </Button>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(notification.id)}
              className="text-red-600 hover:bg-red-100"
              data-testid={`button-delete-${notification.id}`}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}