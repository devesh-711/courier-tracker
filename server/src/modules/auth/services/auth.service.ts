import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { supabase } from '../../../config/supabase.js';
import { env } from '../../../config/env.js';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../../../utils/errors.js';

function signToken(id: string, email: string, role: string): string {
  return jwt.sign({ id, email, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as never,
  });
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

interface UserRow {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const authService = {
  async register(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    phone?: string;
  }) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .maybeSingle();

    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const role = (data.role ?? 'CUSTOMER') as 'CUSTOMER' | 'DRIVER';
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role,
        phone: data.phone ?? null,
      })
      .select('id, email, name, role, phone, created_at')
      .single();

    if (error) throw new Error(`Failed to create user: ${error.message}`);

    if (role === 'CUSTOMER') {
      await supabase.from('customers').insert({ user_id: (user as UserRow).id });
    } else if (role === 'DRIVER') {
      await supabase.from('delivery_agents').insert({ user_id: (user as UserRow).id });
    }

    const token = signToken((user as UserRow).id, (user as UserRow).email, (user as UserRow).role);
    return { user, token };
  },

  async login(email: string, password: string) {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const userRow = user as UserRow;
    const isValid = await bcrypt.compare(password, userRow.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!userRow.is_active) {
      throw new UnauthorizedError('Account is deactivated');
    }

    if (userRow.role === 'ADMIN' || userRow.role === 'DISPATCHER') {
      await supabase
        .from('admins')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', userRow.id);
    }

    const token = signToken(userRow.id, userRow.email, userRow.role);
    return {
      user: {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        role: userRow.role,
        phone: userRow.phone,
      },
      token,
    };
  },

  async getProfile(userId: string) {
    const { data: user } = await supabase
      .from('users')
      .select(
        'id, email, name, role, phone, avatar_url, is_active, created_at',
      )
      .eq('id', userId)
      .maybeSingle();

    if (!user) throw new NotFoundError('User not found');

    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: admin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: agent } = await supabase
      .from('delivery_agents')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    return { ...user, customer, admin, deliveryAgent: agent };
  },

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; avatarUrl?: string },
  ) {
    const updateData: Record<string, string> = {};
    if (data.name) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.avatarUrl) updateData.avatar_url = data.avatarUrl;

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, name, role, phone, avatar_url')
      .single();

    if (error) throw new Error(`Failed to update profile: ${error.message}`);
    return user;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const { data: user } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .maybeSingle();

    if (!user) throw new NotFoundError('User not found');

    const isValid = await bcrypt.compare(currentPassword, (user as UserRow).password);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', userId);

    if (error) throw new Error(`Failed to change password: ${error.message}`);
    return { message: 'Password updated successfully' };
  },

  async forgotPassword(email: string) {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!user) {
      return { message: 'If an account exists for that email, a reset link has been sent' };
    }

    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', (user as { id: string }).id)
      .is('used_at', 'null');

    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('password_reset_tokens').insert({
      user_id: (user as { id: string }).id,
      token,
      expires_at: expiresAt,
    });

    if (error) throw new Error(`Failed to create reset token: ${error.message}`);

    const resetUrl = `${env.clientOrigin}/reset-password?token=${token}`;
    console.log(`[auth] Password reset link for ${email}: ${resetUrl}`);

    return { message: 'If an account exists for that email, a reset link has been sent' };
  },

  async resetPassword(token: string, newPassword: string) {
    const { data: resetToken } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token', token)
      .maybeSingle();

    if (!resetToken) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const tokenRow = resetToken as { id: string; user_id: string; expires_at: string; used_at: string | null };

    if (tokenRow.used_at) {
      throw new ValidationError('This reset token has already been used');
    }

    if (new Date(tokenRow.expires_at) < new Date()) {
      throw new ValidationError('This reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: pwdError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', tokenRow.user_id);

    if (pwdError) throw new Error(`Failed to reset password: ${pwdError.message}`);

    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id);

    if (tokenError) throw new Error(`Failed to invalidate reset token: ${tokenError.message}`);

    return { message: 'Password reset successfully' };
  },

  async verifyToken(token: string) {
    try {
      const payload = jwt.verify(token, env.jwtSecret) as {
        id: string;
        email: string;
        role: string;
      };
      const { data: user } = await supabase
        .from('users')
        .select('id, email, name, role, is_active')
        .eq('id', payload.id)
        .maybeSingle();

      if (!user || !(user as UserRow).is_active) {
        throw new UnauthorizedError('Invalid token');
      }
      return {
        id: (user as UserRow).id,
        email: (user as UserRow).email,
        role: (user as UserRow).role,
        name: (user as UserRow).name,
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  },
};
