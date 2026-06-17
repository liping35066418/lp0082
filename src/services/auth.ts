import type { LoginResponse } from '../../shared/types';
import { api } from './api';

const TOKEN_KEY = 'auth_token';

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', { username, password });

  if (!response.success || !response.data) {
    throw new Error(response.error || '登录失败');
  }

  localStorage.setItem(TOKEN_KEY, response.data.token);

  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout');
  localStorage.removeItem(TOKEN_KEY);
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};
