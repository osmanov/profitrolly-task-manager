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
    update: (id: string, data: any) => apiRequest("PATCH", `/api/portfolios/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/portfolios/${id}`),
  },
  tasks: {
    list: (portfolioId: string) => apiRequest("GET", `/api/portfolios/${portfolioId}/tasks`),
    create: (portfolioId: string, data: any) => apiRequest("POST", `/api/portfolios/${portfolioId}/tasks`, data),
    update: (id: string, data: any) => apiRequest("PATCH", `/api/tasks/${id}`, data),
    delete: (id: string) => apiRequest("DELETE", `/api/tasks/${id}`),
  },
  settings: {
    get: () => apiRequest("GET", "/api/settings"),
    update: (data: any) => apiRequest("PATCH", "/api/settings", data),
  },
  notifications: {
    list: () => apiRequest("GET", "/api/notifications"),
    markAsRead: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    delete: (id: string) => apiRequest("DELETE", `/api/notifications/${id}`),
    acceptCollaboration: (id: string) => apiRequest("POST", `/api/notifications/${id}/accept-collaboration`),
    declineCollaboration: (id: string) => apiRequest("POST", `/api/notifications/${id}/decline-collaboration`),
  },
  utils: {
    getRiskTable: () => apiRequest("GET", "/api/risks/table"),
    getHolidays: () => apiRequest("GET", "/api/holidays/2025"),
  },
};
