import { Router } from 'express';
import { z } from 'zod';
import { trackingController } from '../controllers/tracking.controller.js';
import { authenticate, authorize } from '../../../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../../../middleware/validate.js';
import { auditLog } from '../../../middleware/auditLog.js';
import {
  createTrackingEventSchema,
  updateLocationSchema,
  trackingQuerySchema,
} from '../validators/tracking.validator.js';
import { trackingRateLimiter } from '../../../middleware/rateLimiter.js';

const router = Router();

const trackingParamSchema = z.object({ trackingNumber: z.string().min(1) });

router.use(authenticate);

router.get(
  '/:trackingNumber/history',
  trackingRateLimiter,
  validateParams(trackingParamSchema),
  validateQuery(trackingQuerySchema),
  trackingController.getHistory,
);
router.get(
  '/:trackingNumber/live',
  trackingRateLimiter,
  validateParams(trackingParamSchema),
  trackingController.getLiveTracking,
);
router.post(
  '/:trackingNumber/events',
  authorize('ADMIN', 'DISPATCHER', 'DRIVER'),
  auditLog,
  validateParams(trackingParamSchema),
  validateBody(createTrackingEventSchema),
  trackingController.addEvent,
);
router.patch(
  '/:trackingNumber/location',
  authorize('ADMIN', 'DISPATCHER', 'DRIVER'),
  auditLog,
  validateParams(trackingParamSchema),
  validateBody(updateLocationSchema),
  trackingController.updateLocation,
);

export default router;
