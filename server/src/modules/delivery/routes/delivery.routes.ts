import { Router } from 'express';
import { z } from 'zod';
import { deliveryController } from '../controllers/delivery.controller.js';
import { authenticate, authorize } from '../../../middleware/auth.js';
import { validateBody, validateParams } from '../../../middleware/validate.js';
import { auditLog } from '../../../middleware/auditLog.js';

const router = Router();
const trackingParamSchema = z.object({ trackingNumber: z.string().min(1) });

const updateStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'ON_ROUTE', 'ON_BREAK', 'OFF_DUTY']),
});

const updateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const updateShipmentStatusSchema = z.object({
  status: z.enum(['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION']),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  city: z.string().optional(),
});

router.use(authenticate, authorize('DRIVER'));

router.get('/profile', deliveryController.getProfile);
router.get('/dashboard', deliveryController.getDashboard);
router.patch('/status', auditLog, validateBody(updateStatusSchema), deliveryController.updateStatus);
router.patch('/location', auditLog, validateBody(updateLocationSchema), deliveryController.updateLocation);
router.get('/shipments', deliveryController.getAssignedShipments);
router.patch(
  '/shipments/:trackingNumber/status',
  auditLog,
  validateParams(trackingParamSchema),
  validateBody(updateShipmentStatusSchema),
  deliveryController.updateShipmentStatus,
);

export default router;
