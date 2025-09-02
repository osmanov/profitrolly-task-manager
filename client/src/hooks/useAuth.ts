import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService, setupAuthInterceptor } from "@/services/auth";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { User, LoginData, RegisterData, AuthResponse } from "@/types/auth";

export const useAuth = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Setup auth interceptor on mount
  useEffect(() => {
    setupAuthInterceptor();
    setIsInitialized(true);
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: isInitialized && authService.isAuthenticated(),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<AuthResponse> => {
      const response = await api.auth.login(data);
      return response.json();
    },
    onSuccess: (data) => {
      authService.setToken(data.token);
      authService.setUser(data.user);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData): Promise<AuthResponse> => {
      console.log("Sending registration data:", data);
      const response = await api.auth.register(data);
      console.log("Registration response:", response);
      return response.json();
    },
    onSuccess: (data) => {
      authService.setToken(data.token);
      authService.setUser(data.user);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "Success",
        description: "Account created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    },
  });

  const logout = () => {
    authService.logout();
    queryClient.clear();
  };

  return {
    user: user as User | undefined,
    isLoading: !isInitialized || (authService.isAuthenticated() && isLoading),
    isAuthenticated: authService.isAuthenticated() && !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
  };
};
