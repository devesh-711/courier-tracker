import type { Response, NextFunction } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { trackingService } from '../services/tracking.service.js';
import type { AuthRequest } from '../../../types/express.js';

export const trackingController = {
  getHistory: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await trackingService.getHistory(
      req.params.trackingNumber as string,
      req.query,
    );
    res.json(result);
  }),

  addEvent: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const event = await trackingService.addEvent(
      req.params.trackingNumber as string,
      req.body,
      req.user!.id,
    );
    res.status(201).json(event);
  }),

  updateLocation: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await trackingService.updateLocation(
      req.params.trackingNumber as string,
      req.body.latitude,
      req.body.longitude,
      req.body.city,
    );
    res.json(result);
  }),

  getLiveTracking: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const tracking = await trackingService.getLiveTracking(req.params.trackingNumber as string);
    res.json(tracking);
  }),
};
