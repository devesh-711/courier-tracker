import { Router } from 'express';
import { z } from 'zod';
import { customerController } from '../controllers/customer.controller.js';
import { authenticate, authorize } from '../../../middleware/auth.js';
import { validateBody, validateParams } from '../../../middleware/validate.js';
import { auditLog } from '../../../middleware/auditLog.js';

const router = Router();
const trackingParamSchema = z.object({ trackingNumber: z.string().min(1) });

const updateProfileSchema = z.object({
  companyName: z.string().optional(),
  billingAddress: z.string().optional(),
  defaultAddress: z.string().optional(),
});

router.use(authenticate, authorize('CUSTOMER'));

router.get('/profile', customerController.getProfile);
router.patch('/profile', auditLog, validateBody(updateProfileSchema), customerController.updateProfile);
router.get('/dashboard', customerController.getDashboard);
router.get('/shipments', customerController.getMyShipments);
router.get('/shipments/:trackingNumber', validateParams(trackingParamSchema), customerController.getShipmentDetails);
router.get('/payments', customerController.getMyPayments);
router.get('/notifications', customerController.getMyNotifications);

export default router;
