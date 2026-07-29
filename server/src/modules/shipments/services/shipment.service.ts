import { supabase } from '../../../config/supabase.js';
import { NotFoundError } from '../../../utils/errors.js';
import { parsePagination, paginatedResponse } from '../../../utils/pagination.js';

function generateTrackingNumber(): string {
  const prefix = 'COUR';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

// Map camelCase sort fields to snake_case DB columns
const SORT_FIELD_MAP: Record<string, string> = {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  trackingNumber: 'tracking_number',
  status: 'status',
  weight: 'weight',
  estimatedDelivery: 'estimated_delivery',
};

// Shipment relation select string for Supabase foreign-key syntax
const SHIPMENT_RELATIONS =
  '*, customer:users!customer_id(id, name, email), assigned_agent:delivery_agents!assigned_agent_id(id, status, user:users!user_id(id, name, phone)), origin_branch:branches!origin_branch_id(id, name, city), destination_branch:branches!destination_branch_id(id, name, city)';

function handleError(error: unknown, fallback = 'Database operation failed'): never {
  const message = error instanceof Error ? error.message : fallback;
  throw new Error(message);
}

export const shipmentService = {
  async findAll(query: Record<string, unknown>, customerId?: string) {
    const params = parsePagination({ query });
    const sortField = (query.sortBy as string) || 'createdAt';
    const sortOrder = (query.sortOrder as 'asc' | 'desc') === 'desc' ? 'desc' : 'asc';

    let baseQuery = supabase.from('shipments').select(SHIPMENT_RELATIONS, {
      count: 'exact',
    });

    if (customerId) baseQuery = baseQuery.eq('customer_id', customerId);
    if (query.status) baseQuery = baseQuery.eq('status', query.status as string);
    if (query.serviceType)
      baseQuery = baseQuery.eq('service_type', query.serviceType as string);
    if (query.search) {
      const pattern = `%${query.search as string}%`;
      // OR across three text columns — PostgREST uses `or` filter
      baseQuery = baseQuery.or(
        `tracking_number.ilike.${pattern},sender_name.ilike.${pattern},recipient_name.ilike.${pattern}`,
      );
    }

    const sortColumn = SORT_FIELD_MAP[sortField] ?? 'created_at';
    const ordered = baseQuery.order(sortColumn, {
      ascending: sortOrder === 'asc',
    });

    const { data: shipments, error, count } = await ordered.range(
      params.skip,
      params.skip + params.take - 1,
    );

    if (error) handleError(error);
    return paginatedResponse(shipments ?? [], count ?? 0, params);
  },

  async findById(id: string) {
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(SHIPMENT_RELATIONS)
      .eq('id', id)
      .maybeSingle();

    if (error) handleError(error);
    if (!shipment) throw new NotFoundError('Shipment not found');

    // Fetch tracking history (latest 50) and payments separately
    const [historyRes, paymentsRes] = await Promise.all([
      supabase
        .from('tracking_history')
        .select('*')
        .eq('shipment_id', id)
        .order('timestamp', { ascending: false })
        .limit(50),
      supabase.from('payments').select('*').eq('shipment_id', id),
    ]);

    if (historyRes.error) handleError(historyRes.error);
    if (paymentsRes.error) handleError(paymentsRes.error);

    return {
      ...shipment,
      trackingHistory: historyRes.data ?? [],
      payments: paymentsRes.data ?? [],
    };
  },

  async findByTrackingNumber(trackingNumber: string) {
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(SHIPMENT_RELATIONS)
      .eq('tracking_number', trackingNumber)
      .maybeSingle();

    if (error) handleError(error);
    if (!shipment) throw new NotFoundError('Shipment not found');

    const { data: history, error: historyError } = await supabase
      .from('tracking_history')
      .select('*')
      .eq('shipment_id', shipment.id)
      .order('timestamp', { ascending: false });

    if (historyError) handleError(historyError);

    return {
      ...shipment,
      trackingHistory: history ?? [],
    };
  },

  async create(
    data: {
      trackingNumber?: string;
      serviceType?: string;
      senderName: string;
      senderPhone: string;
      senderAddress: string;
      senderCity: string;
      senderState: string;
      senderPostalCode: string;
      senderLatitude?: number;
      senderLongitude?: number;
      recipientName: string;
      recipientPhone: string;
      recipientAddress: string;
      recipientCity: string;
      recipientState: string;
      recipientPostalCode: string;
      recipientLatitude?: number;
      recipientLongitude?: number;
      weight: number;
      dimensions?: string;
      declaredValue?: number;
      notes?: string;
      estimatedDelivery?: string;
      originBranchId?: string;
      destinationBranchId?: string;
      assignedAgentId?: string;
    },
    customerId?: string,
  ) {
    const trackingNumber = data.trackingNumber || generateTrackingNumber();

    const insertPayload = {
      tracking_number: trackingNumber,
      service_type:
        (data.serviceType as string) ?? 'STANDARD',
      sender_name: data.senderName,
      sender_phone: data.senderPhone,
      sender_address: data.senderAddress,
      sender_city: data.senderCity,
      sender_state: data.senderState,
      sender_postal_code: data.senderPostalCode,
      sender_latitude: data.senderLatitude ?? null,
      sender_longitude: data.senderLongitude ?? null,
      recipient_name: data.recipientName,
      recipient_phone: data.recipientPhone,
      recipient_address: data.recipientAddress,
      recipient_city: data.recipientCity,
      recipient_state: data.recipientState,
      recipient_postal_code: data.recipientPostalCode,
      recipient_latitude: data.recipientLatitude ?? null,
      recipient_longitude: data.recipientLongitude ?? null,
      weight: data.weight,
      dimensions: data.dimensions ?? null,
      declared_value: data.declaredValue ?? null,
      notes: data.notes ?? null,
      estimated_delivery: data.estimatedDelivery
        ? new Date(data.estimatedDelivery).toISOString()
        : null,
      origin_branch_id: data.originBranchId ?? null,
      destination_branch_id: data.destinationBranchId ?? null,
      assigned_agent_id: data.assignedAgentId ?? null,
      customer_id: customerId ?? null,
      status: 'PENDING',
    };

    const { data: shipment, error } = await supabase
      .from('shipments')
      .insert(insertPayload)
      .select(SHIPMENT_RELATIONS)
      .single();

    if (error) handleError(error);
    if (!shipment) throw new NotFoundError('Shipment not created');

    const { error: historyError } = await supabase
      .from('tracking_history')
      .insert({
        shipment_id: shipment.id,
        event_type: 'CREATED',
        message: 'Shipment created and pending pickup',
        latitude: data.senderLatitude ?? null,
        longitude: data.senderLongitude ?? null,
        city: data.senderCity,
        recorded_by: customerId ?? null,
      });

    if (historyError) handleError(historyError);

    return shipment;
  },

  async update(id: string, data: Record<string, unknown>) {
    const { data: existing, error: findError } = await supabase
      .from('shipments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!existing) throw new NotFoundError('Shipment not found');

    const updateData: Record<string, unknown> = {};
    if (data.status) updateData.status = data.status as string;
    if (data.serviceType) updateData.service_type = data.serviceType as string;
    if (data.assignedAgentId !== undefined) {
      updateData.assigned_agent_id = (data.assignedAgentId as string) || null;
    }
    if (data.originBranchId !== undefined) {
      updateData.origin_branch_id = (data.originBranchId as string) || null;
    }
    if (data.destinationBranchId !== undefined) {
      updateData.destination_branch_id =
        (data.destinationBranchId as string) || null;
    }
    if (data.estimatedDelivery !== undefined) {
      updateData.estimated_delivery = data.estimatedDelivery
        ? new Date(data.estimatedDelivery as string).toISOString()
        : null;
    }
    if (data.actualDelivery !== undefined) {
      updateData.actual_delivery = data.actualDelivery
        ? new Date(data.actualDelivery as string).toISOString()
        : null;
    }
    if (data.currentLatitude !== undefined)
      updateData.current_latitude = data.currentLatitude as number | null;
    if (data.currentLongitude !== undefined)
      updateData.current_longitude = data.currentLongitude as number | null;
    if (data.notes !== undefined) updateData.notes = data.notes as string | null;

    const { data: shipment, error } = await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', id)
      .select(SHIPMENT_RELATIONS)
      .single();

    if (error) handleError(error);
    if (!shipment) throw new NotFoundError('Shipment not found');

    if (data.status && data.status !== existing.status) {
      const statusMessages: Record<string, string> = {
        PICKED_UP: 'Package picked up',
        IN_TRANSIT: 'Shipment in transit',
        OUT_FOR_DELIVERY: 'Out for delivery',
        DELIVERED: 'Package delivered',
        EXCEPTION: 'Delivery exception occurred',
        CANCELLED: 'Shipment cancelled',
      };
      const { error: historyError } = await supabase
        .from('tracking_history')
        .insert({
          shipment_id: id,
          event_type: data.eventType as never,
          message:
            statusMessages[data.status as string] ??
            `Status changed to ${data.status as string}`,
          latitude: (data.currentLatitude as number | undefined) ?? null,
          longitude: (data.currentLongitude as number | undefined) ?? null,
        });

      if (historyError) handleError(historyError);

      if (existing.customer_id) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: existing.customer_id,
            shipment_id: id,
            type: 'SHIPMENT_UPDATE',
            title: 'Shipment Status Updated',
            message: `Your shipment ${existing.tracking_number} is now ${String(data.status).replace(/_/g, ' ')}`,
          });

        if (notifError) handleError(notifError);
      }
    }

    return shipment;
  },

  async delete(id: string) {
    const { data: shipment, error: findError } = await supabase
      .from('shipments')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!shipment) throw new NotFoundError('Shipment not found');

    const { error } = await supabase.from('shipments').delete().eq('id', id);
    if (error) handleError(error);

    return { message: 'Shipment deleted successfully' };
  },

  async getStats() {
    const { count: total, error: totalError } = await supabase
      .from('shipments')
      .select('*', { count: 'exact', head: true });

    if (totalError) handleError(totalError);

    // Supabase REST has no groupBy — fetch all status/service_type values and aggregate in JS
    const { data: allShipments, error: fetchError } = await supabase
      .from('shipments')
      .select('status, service_type');

    if (fetchError) handleError(fetchError);

    const byStatus: Record<string, number> = {};
    const byServiceType: Record<string, number> = {};
    for (const s of allShipments ?? []) {
      byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
      byServiceType[s.service_type] = (byServiceType[s.service_type] ?? 0) + 1;
    }

    return {
      total: total ?? 0,
      byStatus,
      byServiceType,
    };
  },
};
