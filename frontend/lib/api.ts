/**
 * API Client for GovAI Backend
 * Handles all HTTP requests with authentication
 */

const API_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
  : 'http://localhost:8000/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: 'An error occurred',
      }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  auth = {
    register: (data: {
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
    }) => this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    login: (email: string, password: string) =>
      this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: (token: string) =>
      this.request('/auth/logout', {
        method: 'POST',
        token,
      }),

    forgotPassword: (email: string) =>
      this.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),

    resetPassword: (token: string, new_password: string) =>
      this.request('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password }),
      }),

    verifyEmail: (token: string) =>
      this.request(`/auth/verify-email?token=${token}`, {
        method: 'GET',
      }),
  };

  // User endpoints
  users = {
    getMe: (token: string) =>
      this.request('/users/me', { token }),

    updateMe: (token: string, data: any) =>
      this.request('/users/me', {
        method: 'PUT',
        token,
        body: JSON.stringify(data),
      }),

    updatePreferences: (token: string, email_frequency: string) =>
      this.request('/users/me/preferences', {
        method: 'PUT',
        token,
        body: JSON.stringify({ email_frequency }),
      }),
  };

  // Company endpoints
  company = {
    get: (token: string) =>
      this.request('/company', { token }),

    create: (token: string, data: any) =>
      this.request('/company', {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      }),

    update: (token: string, data: any) =>
      this.request('/company', {
        method: 'PUT',
        token,
        body: JSON.stringify(data),
      }),
  };

  // Opportunities endpoints
  opportunities = {
    list: (token: string, params?: Record<string, any>) => {
      const query = new URLSearchParams(params).toString();
      return this.request(`/opportunities?${query}`, { token });
    },

    get: (token: string, id: string) =>
      this.request(`/opportunities/${id}`, { token }),

    save: (token: string, id: string, status: string = 'watching') =>
      this.request(`/opportunities/${id}/save`, {
        method: 'POST',
        token,
        body: JSON.stringify({ status }),
      }),

    removeSaved: (token: string, id: string) =>
      this.request(`/opportunities/${id}/save`, {
        method: 'DELETE',
        token,
      }),

    dismiss: (token: string, id: string) =>
      this.request(`/opportunities/${id}/dismiss`, {
        method: 'POST',
        token,
      }),

    updateStatus: (token: string, id: string, status: string) =>
      this.request(`/opportunities/${id}/status`, {
        method: 'PUT',
        token,
        body: JSON.stringify({ status }),
      }),

    addNotes: (token: string, id: string, notes: string) =>
      this.request(`/opportunities/${id}/notes`, {
        method: 'POST',
        token,
        body: JSON.stringify({ notes }),
      }),
  };

  // Pipeline endpoints
  pipeline = {
    list: (token: string, status?: string) => {
      const query = status ? `?status=${status}` : '';
      return this.request(`/pipeline${query}`, { token });
    },

    stats: (token: string) =>
      this.request('/pipeline/stats', { token }),

    deadlines: (token: string, days: number = 14) =>
      this.request(`/pipeline/deadlines?days=${days}`, { token }),
  };
}

export const api = new APIClient(API_URL);
export default api;
