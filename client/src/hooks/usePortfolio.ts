import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
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

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreatePortfolioData> }) => {
      const response = await api.portfolios.update(id, data);
      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", id] });
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

  return useMutation({
    mutationFn: async ({ portfolioId, data }: { portfolioId: string; data: CreateTaskData }) => {
      const response = await api.tasks.create(portfolioId, data);
      return response.json();
    },
    onSuccess: (_, { portfolioId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId] });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios", portfolioId, "tasks"] });
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

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateTaskData> }) => {
      const response = await api.tasks.update(id, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
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

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.tasks.delete(id);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
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
