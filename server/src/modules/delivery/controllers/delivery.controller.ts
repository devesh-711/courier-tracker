import type { Response, NextFunction } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { deliveryService } from '../services/delivery.service.js';
import type { AuthRequest } from '../../../types/express.js';

export const deliveryController = {
  getProfile: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const profile = await deliveryService.getProfile(req.user!.id);
    res.json(profile);
  }),

  updateStatus: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const agent = await deliveryService.updateStatus(req.user!.id, req.body.status);
    res.json(agent);
  }),

  updateLocation: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await deliveryService.updateLocation(
      req.user!.id,
      req.body.latitude,
      req.body.longitude,
    );
    res.json(result);
  }),

  getAssignedShipments: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await deliveryService.getAssignedShipments(req.user!.id, req.query);
    res.json(result);
  }),

  updateShipmentStatus: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await deliveryService.updateShipmentStatus(
      req.user!.id,
      req.params.trackingNumber as string,
      req.body.status,
      req.body.latitude,
      req.body.longitude,
      req.body.city,
    );
    res.json(result);
  }),

  getDashboard: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const dashboard = await deliveryService.getDashboard(req.user!.id);
    res.json(dashboard);
  }),
};
