import { supabase } from '../../../config/supabase.js';
import { NotFoundError } from '../../../utils/errors.js';
import { parsePagination, paginatedResponse } from '../../../utils/pagination.js';

function handleError(error: unknown, fallback = 'Database operation failed'): never {
  const message = error instanceof Error ? error.message : fallback;
  throw new Error(message);
}

export const customerService = {
  async getProfile(userId: string) {
    const { data: user, error } = await supabase
      .from('users')
      .select(
        'id, email, name, role, phone, avatar_url, created_at, customer:customers!customer_id(*)',
      )
      .eq('id', userId)
      .maybeSingle();

    if (error) handleError(error);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },

  async updateProfile(
    userId: string,
    data: { companyName?: string; billingAddress?: string; defaultAddress?: string },
  ) {
    const { data: customer, error: findError } = await supabase
      .from('customers')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!customer) throw new NotFoundError('Customer profile not found');

    const updateData: Record<string, unknown> = {};
    if (data.companyName !== undefined) updateData.company_name = data.companyName;
    if (data.billingAddress !== undefined) updateData.billing_address = data.billingAddress;
    if (data.defaultAddress !== undefined) updateData.default_address = data.defaultAddress;

    const { data: updated, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) handleError(error);
    return updated;
  },

  async getMyShipments(userId: string, query: Record<string, unknown>) {
    const params = parsePagination({ query });

    let baseQuery = supabase.from('shipments').select(
      '*, tracking_history:tracking_history!shipment_id(*), payments:payments!shipment_id(*)',
      { count: 'exact' },
    );
    baseQuery = baseQuery.eq('customer_id', userId);

    const { data: shipments, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    // Sort tracking_history desc and keep only latest per shipment (mimic Prisma take:1)
    const shipmentsWithLatestTracking = (shipments ?? []).map((s) => {
      const history = (s.tracking_history ?? []).sort(
        (a: { timestamp: string }, b: { timestamp: string }) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      return {
        ...s,
        trackingHistory: history.slice(0, 1),
        payments: s.payments ?? [],
      };
    });

    return paginatedResponse(shipmentsWithLatestTracking, count ?? 0, params);
  },

  async getShipmentDetails(userId: string, trackingNumber: string) {
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(
        '*, tracking_history:tracking_history!shipment_id(*), payments:payments!shipment_id(*)',
      )
      .eq('tracking_number', trackingNumber)
      .maybeSingle();

    if (error) handleError(error);
    if (!shipment) throw new NotFoundError('Shipment not found');
    if (shipment.customer_id !== userId) throw new NotFoundError('Shipment not found');

    // Sort tracking history descending
    const history = (shipment.tracking_history ?? []).sort(
      (a: { timestamp: string }, b: { timestamp: string }) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return {
      ...shipment,
      trackingHistory: history,
      payments: shipment.payments ?? [],
    };
  },

  async getMyPayments(userId: string, query: Record<string, unknown>) {
    const params = parsePagination({ query });

    let baseQuery = supabase.from('payments').select(
      '*, shipment:shipments!shipment_id(id, tracking_number, status)',
      { count: 'exact' },
    );
    baseQuery = baseQuery.eq('customer_id', userId);

    const { data: payments, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    return paginatedResponse(payments ?? [], count ?? 0, params);
  },

  async getMyNotifications(userId: string, query: Record<string, unknown>) {
    const params = parsePagination({ query });

    let baseQuery = supabase.from('notifications').select(
      '*, shipment:shipments!shipment_id(id, tracking_number, status)',
      { count: 'exact' },
    );
    baseQuery = baseQuery.eq('user_id', userId);

    const { data: notifications, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    return paginatedResponse(notifications ?? [], count ?? 0, params);
  },

  async getDashboard(userId: string) {
    const [
      totalShipmentsRes,
      activeShipmentsRes,
      deliveredShipmentsRes,
      paymentsRes,
      recentShipmentsRes,
    ] = await Promise.all([
      supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', userId),
      supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', userId)
        .in('status', ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']),
      supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', userId)
        .eq('status', 'DELIVERED'),
      supabase
        .from('payments')
        .select('amount')
        .eq('customer_id', userId)
        .eq('status', 'COMPLETED'),
      supabase
        .from('shipments')
        .select('id, tracking_number, status, created_at, recipient_city')
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .range(0, 4),
    ]);

    if (totalShipmentsRes.error) handleError(totalShipmentsRes.error);
    if (paymentsRes.error) handleError(paymentsRes.error);
    if (recentShipmentsRes.error) handleError(recentShipmentsRes.error);

    const totalSpent = (paymentsRes.data ?? []).reduce(
      (sum, p: { amount: number | null }) => sum + (p.amount ?? 0),
      0,
    );

    return {
      totalShipments: totalShipmentsRes.count ?? 0,
      activeShipments: activeShipmentsRes.count ?? 0,
      deliveredShipments: deliveredShipmentsRes.count ?? 0,
      totalSpent,
      recentShipments: recentShipmentsRes.data ?? [],
    };
  },
};
