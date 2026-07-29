import type { Response, NextFunction } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { customerService } from '../services/customer.service.js';
import type { AuthRequest } from '../../../types/express.js';

export const customerController = {
  getProfile: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const profile = await customerService.getProfile(req.user!.id);
    res.json(profile);
  }),

  updateProfile: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const profile = await customerService.updateProfile(req.user!.id, req.body);
    res.json(profile);
  }),

  getMyShipments: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await customerService.getMyShipments(req.user!.id, req.query);
    res.json(result);
  }),

  getShipmentDetails: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const shipment = await customerService.getShipmentDetails(req.user!.id, req.params.trackingNumber as string);
    res.json(shipment);
  }),

  getMyPayments: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await customerService.getMyPayments(req.user!.id, req.query);
    res.json(result);
  }),

  getMyNotifications: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await customerService.getMyNotifications(req.user!.id, req.query);
    res.json(result);
  }),

  getDashboard: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const dashboard = await customerService.getDashboard(req.user!.id);
    res.json(dashboard);
  }),
};
