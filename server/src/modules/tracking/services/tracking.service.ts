import { supabase } from '../../../config/supabase.js';
import { NotFoundError } from '../../../utils/errors.js';
import { getIO } from '../../../sockets/index.js';
import {
  parsePagination,
  paginatedResponse,
} from '../../../utils/pagination.js';

function handleError(error: unknown, fallback = 'Database operation failed'): never {
  const message = error instanceof Error ? error.message : fallback;
  throw new Error(message);
}

export const trackingService = {
  async getHistory(trackingNumber: string, query: Record<string, unknown>) {
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, customer_id')
      .eq('tracking_number', trackingNumber)
      .maybeSingle();

    if (shipmentError) handleError(shipmentError);
    if (!shipment) throw new NotFoundError('Shipment not found');

    const params = parsePagination({ query });

    let baseQuery = supabase
      .from('tracking_history')
      .select(
        '*, recorded_by_user:users!recorded_by(id, name, role)',
        { count: 'exact' },
      )
      .eq('shipment_id', shipment.id);

    if (query.eventType) {
      baseQuery = baseQuery.eq('event_type', query.eventType as string);
    }

    const { data: events, error, count } = await baseQuery
      .order('timestamp', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    return paginatedResponse(events ?? [], count ?? 0, params);
  },

  async addEvent(
    trackingNumber: string,
    data: {
      eventType: string;
      message: string;
      latitude?: number;
      longitude?: number;
      city?: string;
    },
    recordedBy?: string,
  ) {
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, customer_id, status')
      .eq('tracking_number', trackingNumber)
      .maybeSingle();

    if (shipmentError) handleError(shipmentError);
    if (!shipment) throw new NotFoundError('Shipment not found');

    const { data: event, error } = await supabase
      .from('tracking_history')
      .insert({
        shipment_id: shipment.id,
        event_type: data.eventType,
        message: data.message,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        city: data.city ?? null,
        recorded_by: recordedBy ?? null,
      })
      .select('*, recorded_by_user:users!recorded_by(id, name, role)')
      .single();

    if (error) handleError(error);
    if (!event) throw new NotFoundError('Event not created');

    const statusMap: Record<string, string> = {
      PICKED_UP: 'PICKED_UP',
      IN_TRANSIT: 'IN_TRANSIT',
      OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
      DELIVERED: 'DELIVERED',
      EXCEPTION: 'EXCEPTION',
    };

    if (statusMap[data.eventType]) {
      const updateData: Record<string, unknown> = {
        status: statusMap[data.eventType],
      };
      if (data.latitude !== undefined) updateData.current_latitude = data.latitude;
      if (data.longitude !== undefined) updateData.current_longitude = data.longitude;

      const { error: updateError } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipment.id);

      if (updateError) handleError(updateError);

      if (shipment.customer_id) {
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: shipment.customer_id,
            shipment_id: shipment.id,
            type: 'SHIPMENT_UPDATE',
            title: 'Shipment Update',
            message: `${data.message} — Tracking: ${trackingNumber}`,
          });

        if (notifError) handleError(notifError);
      }
    }

    try {
      const io = getIO();
      io.to(`shipment:${trackingNumber}`).emit('track:update', {
        trackingNumber,
        event,
      });
    } catch {
      // Socket not initialized — skip real-time push
    }

    return event;
  },

  async updateLocation(
    trackingNumber: string,
    latitude: number,
    longitude: number,
    city?: string,
  ) {
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id, customer_id')
      .eq('tracking_number', trackingNumber)
      .maybeSingle();

    if (shipmentError) handleError(shipmentError);
    if (!shipment) throw new NotFoundError('Shipment not found');

    const { error: updateError } = await supabase
      .from('shipments')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
      })
      .eq('id', shipment.id);

    if (updateError) handleError(updateError);

    const { data: event, error } = await supabase
      .from('tracking_history')
      .insert({
        shipment_id: shipment.id,
        event_type: 'LOCATION_UPDATE',
        message: `Location updated: ${city ?? 'Unknown location'}`,
        latitude,
        longitude,
        city: city ?? null,
      })
      .select('id')
      .single();

    if (error) handleError(error);

    try {
      const io = getIO();
      io.to(`shipment:${trackingNumber}`).emit('track:location', {
        trackingNumber,
        latitude,
        longitude,
        city,
      });
    } catch {
      // Socket not initialized
    }

    return { latitude, longitude, city, eventId: event?.id };
  },

  async getLiveTracking(trackingNumber: string) {
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(
        'id, tracking_number, status, current_latitude, current_longitude, estimated_delivery, actual_delivery, sender_city, recipient_city',
      )
      .eq('tracking_number', trackingNumber)
      .maybeSingle();

    if (error) handleError(error);
    if (!shipment) throw new NotFoundError('Shipment not found');

    const { data: history, error: historyError } = await supabase
      .from('tracking_history')
      .select('id, event_type, message, latitude, longitude, city, timestamp')
      .eq('shipment_id', shipment.id)
      .order('timestamp', { ascending: false })
      .limit(5);

    if (historyError) handleError(historyError);

    return {
      ...shipment,
      trackingHistory: history ?? [],
    };
  },
};
