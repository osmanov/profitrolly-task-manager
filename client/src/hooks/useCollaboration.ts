import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Search users for invitation
export const useSearchUsers = (query: string, excludeIds: string[] = []) => {
  return useQuery({
    queryKey: ["/api/users/search", query, excludeIds],
    enabled: query.length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams({
        q: query,
        exclude: excludeIds.join(',')
      });
      const response = await fetch(`/api/users/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.json();
    },
  });
};

// Get portfolio collaborators
export const usePortfolioCollaborators = (portfolioId: string) => {
  return useQuery({
    queryKey: ["/api/portfolios", portfolioId, "collaborators"],
    enabled: !!portfolioId,
  });
};

// Invite user to portfolio
export const useInviteUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ portfolioId, userId, role }: { portfolioId: string; userId: string; role: string }) => {
      const response = await apiRequest("POST", `/api/portfolios/${portfolioId}/collaborators`, { userId, role });
      return response.json();
    },
    onSuccess: (_, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId, "collaborators"] });
      toast({
        title: "Успешно",
        description: "Пользователь приглашен для совместной работы",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось пригласить пользователя",
        variant: "destructive",
      });
    },
  });
};

// Update collaborator role
export const useUpdateCollaboratorRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ collaborationId, role }: { collaborationId: string; role: string }) => {
      const response = await apiRequest("PUT", `/api/collaborators/${collaborationId}/role`, { role });
      return response.json();
    },
    onSuccess: (_, { collaborationId }) => {
      // Invalidate all portfolio collaborators queries
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      toast({
        title: "Успешно",
        description: "Роль пользователя обновлена",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить роль",
        variant: "destructive",
      });
    },
  });
};

// Remove collaborator
export const useRemoveCollaborator = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (collaborationId: string) => {
      const response = await apiRequest("DELETE", `/api/collaborators/${collaborationId}`);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all portfolio collaborators queries
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      toast({
        title: "Успешно",
        description: "Пользователь удален из совместной работы",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить пользователя",
        variant: "destructive",
      });
    },
  });
};

// Accept collaboration invitation
export const useAcceptCollaboration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (collaborationId: string) => {
      const response = await apiRequest("POST", `/api/collaborators/${collaborationId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      toast({
        title: "Успешно",
        description: "Приглашение принято",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось принять приглашение",
        variant: "destructive",
      });
    },
  });
};

// Decline collaboration invitation
export const useDeclineCollaboration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (collaborationId: string) => {
      const response = await apiRequest("POST", `/api/collaborators/${collaborationId}/decline`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      toast({
        title: "Успешно",
        description: "Приглашение отклонено",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отклонить приглашение",
        variant: "destructive",
      });
    },
  });
};