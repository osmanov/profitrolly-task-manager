export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface LoginData {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  fullName: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
