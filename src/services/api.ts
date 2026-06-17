const API_BASE = '/api';
const TOKEN_KEY = 'auth_token';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
}

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const buildQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

const request = async <T = unknown>(
  method: string,
  url: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  try {
    const { headers, params } = options;
    const token = getToken();

    const fullUrl = `${API_BASE}${url}${params ? buildQueryString(params) : ''}`;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body !== undefined && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(fullUrl, config);
    const data: ApiResponse<T> = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `请求失败: ${response.status} ${response.statusText}`,
      };
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : '网络请求失败，请稍后重试';
    return {
      success: false,
      error: message,
    };
  }
};

export const api = {
  get: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('GET', url, undefined, options),
  post: <T = unknown>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', url, body, options),
  put: <T = unknown>(url: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', url, body, options),
  delete: <T = unknown>(url: string, options?: RequestOptions) =>
    request<T>('DELETE', url, undefined, options),
};
