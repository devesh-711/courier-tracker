import { api } from './axios';
import type { AuthResponse, User } from '@/types';

export const authApi = {
  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: 'CUSTOMER' | 'DRIVER';
    phone?: string;
  }): Promise<AuthResponse> {
    const { data: res } = await api.post<AuthResponse>('/auth/register', data);
    return res;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  async updateProfile(data: { name?: string; phone?: string; avatarUrl?: string }): Promise<User> {
    const { data: res } = await api.patch<User>('/auth/me', data);
    return res;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await api.patch<{ message: string }>('/auth/me/password', {
      currentPassword,
      newPassword,
    });
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, password });
    return data;
  },
};
