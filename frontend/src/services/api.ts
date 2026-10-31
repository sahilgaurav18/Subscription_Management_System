const API_BASE_URL = '/api';

export interface ApiErrorPayload {
  code: string;
  message: string;
  field?: string | null;
  status: number;
}

export class ApiError extends Error {
  code: string;
  field?: string | null;
  status: number;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.field = payload.field;
    this.status = payload.status;
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  let url = `${API_BASE_URL}${endpoint}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      url += (url.includes('?') ? '&' : '?') + qs;
    }
  }

  const token = localStorage.getItem('access_token');
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    const errPayload: ApiErrorPayload = {
      code: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection.',
      status: 0,
    };
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message: errPayload.message } }));
    throw new ApiError(errPayload);
  }

  // Handle expired token with automatic refresh attempt
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const tokenData = await refreshResponse.json();
          localStorage.setItem('access_token', tokenData.access_token);
          localStorage.setItem('refresh_token', tokenData.refresh_token);

          // Retry original request with new token
          headers.set('Authorization', `Bearer ${tokenData.access_token}`);
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          // Token refresh failed or session revoked
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login?expired=1';
          const errPayload: ApiErrorPayload = {
            code: 'SESSION_EXPIRED',
            message: 'Your session has expired. Please log in again.',
            status: 401,
          };
          throw new ApiError(errPayload);
        }
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=1';
        throw err;
      }
    }
  }

  if (!response.ok) {
    let code = `HTTP_${response.status}`;
    let message = 'Request failed';
    let field: string | null = null;

    try {
      const errJson = await response.json();
      if (errJson.code) code = errJson.code;
      if (errJson.field) field = errJson.field;
      if (errJson.message) {
        message = errJson.message;
      } else if (typeof errJson.detail === 'string') {
        message = errJson.detail;
      } else if (Array.isArray(errJson.detail)) {
        message = errJson.detail.map((e: { msg?: string }) => e.msg || 'Validation error').join(', ');
      }
    } catch {
      message = `Server error (${response.status})`;
    }

    const apiError = new ApiError({ code, message, field, status: response.status });
    
    // Broadcast toast for unexpected or general errors (unless 401 which redirects)
    if (response.status !== 401 && response.status !== 404) {
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { type: 'error', message, code } }));
    }
    throw apiError;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>) =>
    apiRequest<T>(endpoint, { method: 'GET', params }),
  post: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};
