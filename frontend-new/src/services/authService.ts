import api from './api';

// Types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_admin: boolean;
  is_active: boolean;
  organization_id: string;
}

// Token storage helpers
const TOKEN_KEY = 'auth_token';

const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  // Update default headers for all future requests
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  // Remove Authorization header
  delete api.defaults.headers.common['Authorization'];
};

// Check and set token on service initialization
const token = getToken();
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Authentication service methods
export const authService = {
  /**
   * Log in a user
   */
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    // Convert to form data format expected by FastAPI's OAuth2 implementation
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post<AuthTokens>('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    const tokens = response.data;
    setToken(tokens.access_token);
    return tokens;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    const response = await api.post<User>('/api/auth/register', data);
    return response.data;
  },

  /**
   * Get the current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  /**
   * Log out the current user
   */
  logout(): void {
    removeToken();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!getToken();
  },

  /**
   * Initialize auth state from storage
   */
  initializeAuth(): string | null {
    return getToken();
  }
};

export default authService; 