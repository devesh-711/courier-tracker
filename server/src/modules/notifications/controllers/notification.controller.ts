import type { Response, NextFunction } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { notificationService } from '../services/notification.service.js';
import type { AuthRequest } from '../../../types/express.js';

export const notificationController = {
  findAll: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await notificationService.findAll(req.user!.id, req.query);
    res.json(result);
  }),

  markAsRead: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const notification = await notificationService.markAsRead(req.params.id as string, req.user!.id);
    res.json(notification);
  }),

  markAllAsRead: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await notificationService.markAllAsRead(req.user!.id);
    res.json(result);
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await notificationService.delete(req.params.id as string, req.user!.id);
    res.json(result);
  }),

  getUnreadCount: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await notificationService.getUnreadCount(req.user!.id);
    res.json(result);
  }),
};
