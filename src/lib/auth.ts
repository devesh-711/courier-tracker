import { dataStore } from './dataStore';
import type { AuthResponse, User } from '@/types';
import { STORAGE_KEYS } from './config';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authApi = {
  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: 'CUSTOMER' | 'DRIVER';
    phone?: string;
  }): Promise<AuthResponse> {
    await delay(300);
    const users = dataStore.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    
    if (existing) {
      throw new Error('An account with this email address already exists. Please sign in instead.');
    }

    const newUser = dataStore.addUser({
      email: data.email,
      name: data.name,
      role: data.role || 'CUSTOMER',
      phone: data.phone,
      isActive: true,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
    });

    const token = `token_${newUser.id}_${Date.now()}`;
    localStorage.setItem('cos_current_user_id', newUser.id);
    return { token, user: newUser };
  },

  async login(email: string, password?: string): Promise<AuthResponse> {
    void password;
    await delay(300);
    const users = dataStore.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // If user doesn't exist yet, auto-create as customer so demo login always succeeds
      user = dataStore.addUser({
        email,
        name: email.split('@')[0] || 'User',
        role: email.includes('admin') ? 'ADMIN' : email.includes('driver') ? 'DRIVER' : 'CUSTOMER',
        isActive: true,
      });
    }

    const token = `token_${user.id}_${Date.now()}`;
    localStorage.setItem('cos_current_user_id', user.id);
    return { token, user };
  },

  async getMe(): Promise<User> {
    await delay(100);
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) {
      throw new Error('Unauthenticated');
    }

    const savedUserId = localStorage.getItem('cos_current_user_id');
    const users = dataStore.getUsers();
    
    let user = users.find((u) => u.id === savedUserId);
    if (!user && token) {
      // Extract user id from token if present
      const match = users.find((u) => token.includes(u.id));
      user = match || users[0];
    }

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },

  async updateProfile(data: { name?: string; phone?: string; avatarUrl?: string }): Promise<User> {
    await delay(200);
    const current = await this.getMe();
    const users = dataStore.getUsers();
    const idx = users.findIndex((u) => u.id === current.id);
    
    if (idx !== -1) {
      const updated = {
        ...users[idx]!,
        ...data,
        updatedAt: new Date().toISOString(),
      };
      users[idx] = updated;
      localStorage.setItem('cos_users', JSON.stringify(users));
      return updated;
    }
    
    return current;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    void currentPassword;
    void newPassword;
    await delay(200);
    return { message: 'Password updated successfully' };
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    void email;
    await delay(200);
    return { message: 'Password reset link sent to your email!' };
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    void token;
    void password;
    await delay(200);
    return { message: 'Password has been reset successfully!' };
  },
};

