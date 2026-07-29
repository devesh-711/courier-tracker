import { Router } from 'express';
import { shipmentController } from '../controllers/shipment.controller.js';
import { authenticate, authorize } from '../../../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../../../middleware/validate.js';
import { auditLog } from '../../../middleware/auditLog.js';
import { z } from 'zod';
import {
  createShipmentSchema,
  updateShipmentSchema,
  shipmentQuerySchema,
} from '../validators/shipment.validator.js';
import { apiRateLimiter } from '../../../middleware/rateLimiter.js';

const router = Router();

const idParamSchema = z.object({ id: z.string().uuid() });
const trackingParamSchema = z.object({ trackingNumber: z.string().min(1) });

router.use(authenticate);

router.get('/', validateQuery(shipmentQuerySchema), shipmentController.findAll);
router.get('/stats', authorize('ADMIN', 'DISPATCHER'), shipmentController.getStats);
router.get(
  '/tracking/:trackingNumber',
  validateParams(trackingParamSchema),
  shipmentController.findByTrackingNumber,
);
router.get('/:id', validateParams(idParamSchema), shipmentController.findById);
router.post(
  '/',
  apiRateLimiter,
  auditLog,
  validateBody(createShipmentSchema),
  shipmentController.create,
);
router.patch(
  '/:id',
  authorize('ADMIN', 'DISPATCHER'),
  auditLog,
  validateParams(idParamSchema),
  validateBody(updateShipmentSchema),
  shipmentController.update,
);
router.delete(
  '/:id',
  authorize('ADMIN', 'DISPATCHER'),
  auditLog,
  validateParams(idParamSchema),
  shipmentController.delete,
);

export default router;
