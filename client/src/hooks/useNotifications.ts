import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  userId: string;
  type: 'collaboration_invite' | 'collaboration_accepted' | 'collaboration_declined';
  title: string;
  message: string;
  data?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['/api/notifications'],
  });

  return {
    notifications: notifications as Notification[] | undefined,
    isLoading,
  };
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.notifications.markAsRead(notificationId);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отметить уведомление как прочитанное",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.notifications.delete(notificationId);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить уведомление",
        variant: "destructive",
      });
    },
  });
}

export function useAcceptCollaborationFromNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.notifications.acceptCollaboration(notificationId);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolios'] });
      toast({
        title: "Успешно",
        description: "Приглашение принято",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось принять приглашение",
        variant: "destructive",
      });
    },
  });
}

export function useDeclineCollaborationFromNotification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.notifications.declineCollaboration(notificationId);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "Успешно",
        description: "Приглашение отклонено",
        variant: "success",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить приглашение",
        variant: "destructive",
      });
    },
  });
}