import { Router } from 'express';
import { z } from 'zod';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../../../middleware/auth.js';
import { validateBody, validateParams } from '../../../middleware/validate.js';
import { auditLog } from '../../../middleware/auditLog.js';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.use(authenticate, authorize('ADMIN'));

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Users
router.get('/users', adminController.findAllUsers);
router.patch('/users/:id', auditLog, validateParams(idParamSchema), adminController.updateUser);
router.delete('/users/:id', auditLog, validateParams(idParamSchema), adminController.deleteUser);

// Warehouses
const warehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  capacity: z.number().int().positive().optional(),
});
router.get('/warehouses', adminController.findAllWarehouses);
router.post('/warehouses', auditLog, validateBody(warehouseSchema), adminController.createWarehouse);
router.patch('/warehouses/:id', auditLog, validateParams(idParamSchema), adminController.updateWarehouse);
router.delete('/warehouses/:id', auditLog, validateParams(idParamSchema), adminController.deleteWarehouse);

// Branches
const branchSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  warehouseId: z.string().uuid(),
  managerId: z.string().uuid().optional(),
});
router.get('/branches', adminController.findAllBranches);
router.post('/branches', auditLog, validateBody(branchSchema), adminController.createBranch);
router.patch('/branches/:id', auditLog, validateParams(idParamSchema), adminController.updateBranch);
router.delete('/branches/:id', auditLog, validateParams(idParamSchema), adminController.deleteBranch);

// Vehicles
const vehicleSchema = z.object({
  registration: z.string().min(1),
  type: z.enum(['VAN', 'TRUCK', 'MOTORCYCLE', 'BIKE', 'DRONE']).optional(),
  model: z.string().optional(),
  capacityWeight: z.number().positive().optional(),
  capacityVolume: z.number().optional(),
  branchId: z.string().uuid(),
  currentWarehouseId: z.string().uuid().optional(),
});
router.get('/vehicles', adminController.findAllVehicles);
router.post('/vehicles', auditLog, validateBody(vehicleSchema), adminController.createVehicle);
router.patch('/vehicles/:id', auditLog, validateParams(idParamSchema), adminController.updateVehicle);
router.delete('/vehicles/:id', auditLog, validateParams(idParamSchema), adminController.deleteVehicle);

// Audit Logs
router.get('/audit-logs', adminController.findAllAuditLogs);

export default router;
