import type { Response, NextFunction } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { shipmentService } from '../services/shipment.service.js';
import type { AuthRequest } from '../../../types/express.js';

export const shipmentController = {
  findAll: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const customerId = req.user!.role === 'CUSTOMER' ? req.user!.id : undefined;
    const result = await shipmentService.findAll(req.query, customerId);
    res.json(result);
  }),

  findById: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const shipment = await shipmentService.findById(req.params.id as string);
    if (req.user!.role === 'CUSTOMER' && shipment.customerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(shipment);
  }),

  findByTrackingNumber: asyncHandler(
    async (req: AuthRequest, res: Response, _next: NextFunction) => {
      const shipment = await shipmentService.findByTrackingNumber(req.params.trackingNumber as string);
      res.json(shipment);
    },
  ),

  create: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const customerId = req.user!.role === 'CUSTOMER' ? req.user!.id : (req.body.customerId as string | undefined);
    const shipment = await shipmentService.create(req.body, customerId);
    res.status(201).json(shipment);
  }),

  update: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const shipment = await shipmentService.update(req.params.id as string, req.body);
    res.json(shipment);
  }),

  delete: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await shipmentService.delete(req.params.id as string);
    res.json(result);
  }),

  getStats: asyncHandler(async (_req: AuthRequest, res: Response, _next: NextFunction) => {
    const stats = await shipmentService.getStats();
    res.json(stats);
  }),
};
