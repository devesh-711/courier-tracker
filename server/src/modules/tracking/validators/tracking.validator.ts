import { z } from 'zod';

export const createTrackingEventSchema = z.object({
  eventType: z.enum([
    'CREATED',
    'PICKED_UP',
    'DEPARTED',
    'IN_TRANSIT',
    'ARRIVED',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'EXCEPTION',
    'LOCATION_UPDATE',
  ]),
  message: z.string().min(1, 'Message is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  city: z.string().optional(),
});

export const updateLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().optional(),
});

export const trackingQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  eventType: z.string().optional(),
});
