import { supabase } from '../../../config/supabase.js';
import { NotFoundError } from '../../../utils/errors.js';
import { parsePagination, paginatedResponse } from '../../../utils/pagination.js';

function handleError(error: unknown, fallback = 'Database operation failed'): never {
  const message = error instanceof Error ? error.message : fallback;
  throw new Error(message);
}

export const notificationService = {
  async findAll(userId: string, query: Record<string, unknown>) {
    const params = parsePagination({ query });

    let baseQuery = supabase.from('notifications').select(
      '*, shipment:shipments!shipment_id(id, tracking_number, status)',
      { count: 'exact' },
    );
    baseQuery = baseQuery.eq('user_id', userId);
    if (query.status) baseQuery = baseQuery.eq('status', query.status as string);

    const { data: notifications, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    return paginatedResponse(notifications ?? [], count ?? 0, params);
  },

  async markAsRead(id: string, userId: string) {
    const { data: notification, error: findError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!notification) throw new NotFoundError('Notification not found');
    if (notification.user_id !== userId) throw new NotFoundError('Notification not found');

    const { data: updated, error } = await supabase
      .from('notifications')
      .update({ status: 'READ', read_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, shipment:shipments!shipment_id(id, tracking_number, status)')
      .single();

    if (error) handleError(error);
    return updated;
  },

  async markAllAsRead(userId: string) {
    // Supabase update() returns affected count via the returned data length when using select()
    const { data, error } = await supabase
      .from('notifications')
      .update({ status: 'READ', read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'UNREAD')
      .select('id');

    if (error) handleError(error);

    const count = data?.length ?? 0;
    return { message: `${count} notifications marked as read` };
  },

  async delete(id: string, userId: string) {
    const { data: notification, error: findError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!notification) throw new NotFoundError('Notification not found');
    if (notification.user_id !== userId) throw new NotFoundError('Notification not found');

    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) handleError(error);

    return { message: 'Notification deleted' };
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'UNREAD');

    if (error) handleError(error);

    return { unread: count ?? 0 };
  },
};
