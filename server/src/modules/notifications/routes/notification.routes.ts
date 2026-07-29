import { Router } from 'express';
import { z } from 'zod';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../../../middleware/auth.js';
import { validateParams } from '../../../middleware/validate.js';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate);

router.get('/', notificationController.findAll);
router.get('/unread/count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', validateParams(idParamSchema), notificationController.markAsRead);
router.delete('/:id', validateParams(idParamSchema), notificationController.delete);

export default router;
