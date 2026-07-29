import { Router, type Request, type Response } from 'express';
import authRoutes from '../modules/auth/routes/auth.routes.js';
import shipmentRoutes from '../modules/shipments/routes/shipment.routes.js';
import trackingRoutes from '../modules/tracking/routes/tracking.routes.js';
import notificationRoutes from '../modules/notifications/routes/notification.routes.js';
import adminRoutes from '../modules/admin/routes/admin.routes.js';
import customerRoutes from '../modules/customer/routes/customer.routes.js';
import deliveryRoutes from '../modules/delivery/routes/delivery.routes.js';

const router = Router();

// Health check
router.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'Courier Management API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
  });
});

// Module routes
router.use('/auth', authRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/tracking', trackingRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);
router.use('/customer', customerRoutes);
router.use('/delivery', deliveryRoutes);

export default router;
