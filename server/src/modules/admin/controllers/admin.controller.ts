import type { Response, NextFunction } from 'express';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { adminService } from '../services/admin.service.js';
import type { AuthRequest } from '../../../types/express.js';

export const adminController = {
  // Users
  findAllUsers: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await adminService.findAllUsers(req.query);
    res.json(result);
  }),
  updateUser: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const user = await adminService.updateUser(req.params.id as string, req.body);
    res.json(user);
  }),
  deleteUser: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await adminService.deleteUser(req.params.id as string);
    res.json(result);
  }),

  // Warehouses
  findAllWarehouses: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await adminService.findAllWarehouses(req.query);
    res.json(result);
  }),
  createWarehouse: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const warehouse = await adminService.createWarehouse(req.body);
    res.status(201).json(warehouse);
  }),
  updateWarehouse: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const warehouse = await adminService.updateWarehouse(req.params.id as string, req.body);
    res.json(warehouse);
  }),
  deleteWarehouse: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await adminService.deleteWarehouse(req.params.id as string);
    res.json(result);
  }),

  // Branches
  findAllBranches: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await adminService.findAllBranches(req.query);
    res.json(result);
  }),
  createBranch: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const branch = await adminService.createBranch(req.body);
    res.status(201).json(branch);
  }),
  updateBranch: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const branch = await adminService.updateBranch(req.params.id as string, req.body);
    res.json(branch);
  }),
  deleteBranch: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await adminService.deleteBranch(req.params.id as string);
    res.json(result);
  }),

  // Vehicles
  findAllVehicles: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await adminService.findAllVehicles(req.query);
    res.json(result);
  }),
  createVehicle: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const vehicle = await adminService.createVehicle(req.body);
    res.status(201).json(vehicle);
  }),
  updateVehicle: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const vehicle = await adminService.updateVehicle(req.params.id as string, req.body);
    res.json(vehicle);
  }),
  deleteVehicle: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await adminService.deleteVehicle(req.params.id as string);
    res.json(result);
  }),

  // Audit Logs
  findAllAuditLogs: asyncHandler(async (req: AuthRequest, res: Response, _next: NextFunction) => {
    const result = await adminService.findAllAuditLogs(req.query);
    res.json(result);
  }),

  // Dashboard
  getDashboardStats: asyncHandler(async (_req: AuthRequest, res: Response, _next: NextFunction) => {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  }),
};
