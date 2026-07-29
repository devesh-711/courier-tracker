import { z } from 'zod';

export const createShipmentSchema = z.object({
  trackingNumber: z.string().min(1).optional(),
  serviceType: z.enum(['STANDARD', 'EXPRESS', 'SAME_DAY', 'OVERNIGHT', 'FREIGHT']).optional(),
  senderName: z.string().min(1, 'Sender name is required'),
  senderPhone: z.string().min(1, 'Sender phone is required'),
  senderAddress: z.string().min(1, 'Sender address is required'),
  senderCity: z.string().min(1, 'Sender city is required'),
  senderState: z.string().min(1, 'Sender state is required'),
  senderPostalCode: z.string().min(1, 'Sender postal code is required'),
  senderLatitude: z.number().optional(),
  senderLongitude: z.number().optional(),
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientPhone: z.string().min(1, 'Recipient phone is required'),
  recipientAddress: z.string().min(1, 'Recipient address is required'),
  recipientCity: z.string().min(1, 'Recipient city is required'),
  recipientState: z.string().min(1, 'Recipient state is required'),
  recipientPostalCode: z.string().min(1, 'Recipient postal code is required'),
  recipientLatitude: z.number().optional(),
  recipientLongitude: z.number().optional(),
  weight: z.number().positive('Weight must be positive'),
  dimensions: z.string().optional(),
  declaredValue: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  estimatedDelivery: z.string().datetime().optional(),
  originBranchId: z.string().uuid().optional(),
  destinationBranchId: z.string().uuid().optional(),
  assignedAgentId: z.string().uuid().optional(),
});

export const updateShipmentSchema = z.object({
  status: z
    .enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'CANCELLED'])
    .optional(),
  serviceType: z.enum(['STANDARD', 'EXPRESS', 'SAME_DAY', 'OVERNIGHT', 'FREIGHT']).optional(),
  assignedAgentId: z.string().uuid().nullable().optional(),
  originBranchId: z.string().uuid().nullable().optional(),
  destinationBranchId: z.string().uuid().nullable().optional(),
  estimatedDelivery: z.string().datetime().nullable().optional(),
  actualDelivery: z.string().datetime().nullable().optional(),
  currentLatitude: z.number().nullable().optional(),
  currentLongitude: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const shipmentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z
    .enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'CANCELLED'])
    .optional(),
  serviceType: z.enum(['STANDARD', 'EXPRESS', 'SAME_DAY', 'OVERNIGHT', 'FREIGHT']).optional(),
  search: z.string().optional(),
});
