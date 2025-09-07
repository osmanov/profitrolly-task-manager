import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Portfolio, PortfolioWithTasks, CreatePortfolioData, CreateTaskData } from "@/types/portfolio";

export const usePortfolios = () => {
  const { data: portfolios, isLoading } = useQuery({
    queryKey: ["/api/portfolios"],
  });

  return {
    portfolios: portfolios as Portfolio[] | undefined,
    isLoading,
  };
};

export const usePortfolio = (id: string) => {
  const { data: portfolio, isLoading } = useQuery({
    queryKey: ["/api/portfolios", id],
    enabled: !!id,
  });

  return {
    portfolio: portfolio as PortfolioWithTasks | undefined,
    isLoading,
  };
};

export const useCreatePortfolio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePortfolioData) => {
      const response = await api.portfolios.create(data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      toast({
        title: "Успешно",
        description: "Portfolio успешно создано",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать portfolio",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePortfolio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { notifyPortfolioUpdate } = useWebSocket();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePortfolioData> }) => {
      const response = await api.portfolios.update(id, data);
      return response.json();
    },
    onSuccess: (updatedPortfolio, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", id] });
      
      // Notify other users via WebSocket
      notifyPortfolioUpdate(id, updatedPortfolio);
      
      toast({
        title: "Успешно",
        description: "Portfolio успешно обновлено",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить portfolio",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePortfolio = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.portfolios.delete(id);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      toast({
        title: "Успешно",
        description: "Portfolio успешно удалено",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить portfolio",
        variant: "destructive",
      });
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { notifyTaskUpdate } = useWebSocket();

  return useMutation({
    mutationFn: async ({ portfolioId, data }: { portfolioId: string; data: CreateTaskData }) => {
      const response = await api.tasks.create(portfolioId, data);
      return response.json();
    },
    onSuccess: (newTask, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId, "tasks"] });
      
      // Notify other users via WebSocket
      if (newTask && newTask.id) {
        notifyTaskUpdate(portfolioId, newTask.id, newTask);
      }
      
      toast({
        title: "Успешно",
        description: "Задача успешно создана",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать задачу",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { notifyTaskUpdate } = useWebSocket();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTaskData> }) => {
      const response = await api.tasks.update(id, data);
      return response.json();
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      
      // Notify other users via WebSocket
      if (updatedTask && updatedTask.portfolioId && updatedTask.id) {
        notifyTaskUpdate(updatedTask.portfolioId, updatedTask.id, updatedTask);
      }
      
      toast({
        title: "Успешно",
        description: "Задача успешно обновлена",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить задачу",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { notifyTaskUpdate } = useWebSocket();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.tasks.delete(id);
      return response.json();
    },
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      
      // Notify other users via WebSocket about task deletion
      // Note: We'll get portfolioId from the deleted task in the server response
      if (result && result.portfolioId) {
        notifyTaskUpdate(result.portfolioId, id, { deleted: true });
      }
      
      toast({
        title: "Успешно",
        description: "Задача успешно удалена",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить задачу",
        variant: "destructive",
      });
    },
  });
};
