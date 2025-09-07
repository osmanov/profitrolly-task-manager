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
    const token = authService.getToken();
    if (!token) return false;
    
    try {
      // Basic JWT validation - check if it's expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < currentTime) {
        // Token expired, clean up
        authService.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      // Invalid token format, clean up
      authService.logout();
      return false;
    }
  },

  logout: (): void => {
    authService.removeToken();
    localStorage.clear(); // Clear all localStorage for clean state
    // Don't redirect automatically, let the app handle routing
  },
};

// Add token to all API requests and handle 401 errors
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
    
    const response = await originalFetch(input, init);
    
    // If we get 401, clear tokens and redirect to login
    if (response.status === 401) {
      authService.logout();
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = "/login";
      }
    }
    
    return response;
  };
};
