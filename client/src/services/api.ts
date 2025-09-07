import { apiRequest } from "@/lib/queryClient";

export const api = {
  auth: {
    login: (data: any) => apiRequest("POST", "/api/auth/login", data),
    register: (data: any) => apiRequest("POST", "/api/auth/register", data),
    me: () => apiRequest("GET", "/api/auth/me"),
  },
  portfolios: {
    list: () => apiRequest("GET", "/api/portfolios"),
    get: (id: string) => apiRequest("GET", `/api/portfolios/${id}`),
    create: (data: any) => apiRequest("POST", "/api/portfolios", data),
    update: (id: string, data: any) => apiRequest("PUT", `/api/portfolios/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/portfolios/${id}`),
  },
  tasks: {
    list: (portfolioId: string) => apiRequest("GET", `/api/portfolios/${portfolioId}/tasks`),
    create: (portfolioId: string, data: any) => apiRequest("POST", `/api/portfolios/${portfolioId}/tasks`, data),
    update: (id: string, data: any) => apiRequest("PUT", `/api/tasks/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/tasks/${id}`),
  },
  settings: {
    get: () => apiRequest("GET", "/api/settings"),
    update: (data: any) => apiRequest("PUT", "/api/settings", data),
  },
  utils: {
    getRiskTable: () => apiRequest("GET", "/api/risks/table"),
    getHolidays: () => apiRequest("GET", "/api/holidays/2025"),
  },
};
