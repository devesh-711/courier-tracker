import type { Response, NextFunction } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { authService } from '../services/auth.service.js';
import type { AuthRequest } from '../../../types/express.js';

export const authController = {
  register: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { user, token } = await authService.register(req.body);
    res.status(201).json({ user, token });
  }),

  login: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const { user, token } = await authService.login(req.body.email, req.body.password);
    res.json({ user, token });
  }),

  getMe: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const profile = await authService.getProfile(req.user!.id);
    res.json(profile);
  }),

  updateMe: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const user = await authService.updateProfile(req.user!.id, req.body);
    res.json(user);
  }),

  changePassword: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await authService.changePassword(
      req.user!.id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    res.json(result);
  }),

  forgotPassword: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await authService.forgotPassword(req.body.email);
    res.json(result);
  }),

  resetPassword: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.json(result);
  }),
};
