import { supabase } from '../../../config/supabase.js';
import { NotFoundError } from '../../../utils/errors.js';
import { parsePagination, paginatedResponse } from '../../../utils/pagination.js';

function handleError(error: unknown, fallback = 'Database operation failed'): never {
  const message = error instanceof Error ? error.message : fallback;
  throw new Error(message);
}

export const deliveryService = {
  async getProfile(userId: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select(
        'id, email, name, role, phone, delivery_agent:delivery_agents!user_id(*, vehicle:vehicles!vehicle_id(id, registration, type, model), branch:branches!branch_id(id, name, city))',
      )
      .eq('id', userId)
      .maybeSingle();

    if (error) handleError(error);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  async updateStatus(userId: string, status: string) {
    const { data: agent, error: findError } = await supabase
      .from('delivery_agents')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!agent) throw new NotFoundError('Delivery agent profile not found');

    const { data: updated, error } = await supabase
      .from('delivery_agents')
      .update({ status })
      .eq('user_id', userId)
      .select(
        '*, vehicle:vehicles!vehicle_id(id, registration, type), branch:branches!branch_id(id, name, city)',
      )
      .single();

    if (error) handleError(error);
    return updated;
  },

  async updateLocation(userId: string, latitude: number, longitude: number) {
    const { data: agent, error: findError } = await supabase
      .from('delivery_agents')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!agent) throw new NotFoundError('Delivery agent profile not found');

    const { data: updated, error } = await supabase
      .from('delivery_agents')
      .update({ current_latitude: latitude, current_longitude: longitude })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) handleError(error);
    return updated;
  },

  async getAssignedShipments(userId: string, query: Record<string, unknown>) {
    const { data: agent, error: findError } = await supabase
      .from('delivery_agents')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!agent) throw new NotFoundError('Delivery agent profile not found');

    const params = parsePagination({ query });

    let baseQuery = supabase.from('shipments').select(
      '*, tracking_history:tracking_history!shipment_id(*)',
      { count: 'exact' },
    );
    baseQuery = baseQuery.eq('assigned_agent_id', agent.id);
    if (query.status) baseQuery = baseQuery.eq('status', query.status as string);

    const { data: shipments, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    // Mimic Prisma's trackingHistory take:3, orderBy timestamp desc
    const shipmentsWithLatestTracking = (shipments ?? []).map((s) => {
      const history = (s.tracking_history ?? []).sort(
        (a: { timestamp: string }, b: { timestamp: string }) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      return {
        ...s,
        trackingHistory: history.slice(0, 3),
      };
    });

    return paginatedResponse(shipmentsWithLatestTracking, count ?? 0, params);
  },

  async updateShipmentStatus(
    userId: string,
    trackingNumber: string,
    status: string,
    latitude?: number,
    longitude?: number,
    city?: string,
  ) {
    const { data: agent, error: findError } = await supabase
      .from('delivery_agents')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!agent) throw new NotFoundError('Delivery agent profile not found');

    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, customer_id, assigned_agent_id')
      .eq('tracking_number', trackingNumber)
      .maybeSingle();

    if (shipmentError) handleError(shipmentError);
    if (!shipment) throw new NotFoundError('Shipment not found');
    if (shipment.assigned_agent_id !== agent.id) {
      throw new NotFoundError('Shipment not assigned to you');
    }

    const statusMessages: Record<string, string> = {
      PICKED_UP: 'Package picked up by driver',
      IN_TRANSIT: 'Shipment in transit',
      OUT_FOR_DELIVERY: 'Out for delivery',
      DELIVERED: 'Package delivered to recipient',
      EXCEPTION: 'Delivery exception occurred',
    };

    const updateData: Record<string, unknown> = { status };
    if (latitude !== undefined) updateData.current_latitude = latitude;
    if (longitude !== undefined) updateData.current_longitude = longitude;
    if (status === 'DELIVERED') updateData.actual_delivery = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', shipment.id);

    if (updateError) handleError(updateError);

    const { data: event, error: eventError } = await supabase
      .from('tracking_history')
      .insert({
        shipment_id: shipment.id,
        event_type: status,
        message: statusMessages[status] ?? `Status updated to ${status}`,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        city: city ?? null,
        recorded_by: userId,
      })
      .select()
      .single();

    if (eventError) handleError(eventError);

    if (shipment.customer_id) {
      const { error: notifError } = await supabase.from('notifications').insert({
        user_id: shipment.customer_id,
        shipment_id: shipment.id,
        type: 'SHIPMENT_UPDATE',
        title: 'Shipment Update',
        message: `${statusMessages[status] ?? status} — Tracking: ${trackingNumber}`,
      });

      if (notifError) handleError(notifError);
    }

    if (status === 'DELIVERED') {
      // Increment total_deliveries atomically — fetch then update
      const { data: currentAgent, error: agentFetchError } = await supabase
        .from('delivery_agents')
        .select('total_deliveries')
        .eq('user_id', userId)
        .single();

      if (agentFetchError) handleError(agentFetchError);

      const newCount = (currentAgent?.total_deliveries ?? 0) + 1;
      const { error: agentUpdateError } = await supabase
        .from('delivery_agents')
        .update({ total_deliveries: newCount })
        .eq('user_id', userId);

      if (agentUpdateError) handleError(agentUpdateError);
    }

    return {
      shipment: { id: shipment.id, trackingNumber, status },
      event,
    };
  },

  async getDashboard(userId: string) {
    const { data: agent, error: findError } = await supabase
      .from('delivery_agents')
      .select('id, status, rating, total_deliveries')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!agent) throw new NotFoundError('Delivery agent profile not found');

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [assignedRes, activeRes, deliveredTodayRes] = await Promise.all([
      supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_agent_id', agent.id),
      supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_agent_id', agent.id)
        .in('status', ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']),
      supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_agent_id', agent.id)
        .eq('status', 'DELIVERED')
        .gte('actual_delivery', startOfDay.toISOString()),
    ]);

    if (assignedRes.error) handleError(assignedRes.error);
    if (activeRes.error) handleError(activeRes.error);
    if (deliveredTodayRes.error) handleError(deliveredTodayRes.error);

    return {
      agentId: agent.id,
      status: agent.status,
      rating: agent.rating,
      assignedShipments: assignedRes.count ?? 0,
      activeShipments: activeRes.count ?? 0,
      deliveredToday: deliveredTodayRes.count ?? 0,
      totalDeliveries: agent.total_deliveries,
    };
  },
};
