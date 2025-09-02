const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const authService = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getUser: (): any | null => {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  setUser: (user: any): void => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  isAuthenticated: (): boolean => {
    return !!authService.getToken();
  },

  logout: (): void => {
    authService.removeToken();
    window.location.href = "/login";
  },
};

// Add token to all API requests
export const setupAuthInterceptor = () => {
  const originalFetch = window.fetch;
  window.fetch = async (input, init = {}) => {
    const token = authService.getToken();
    if (token) {
      init.headers = {
        ...init.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    return originalFetch(input, init);
  };
};
