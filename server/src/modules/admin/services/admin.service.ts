import { supabase } from '../../../config/supabase.js';
import { NotFoundError } from '../../../utils/errors.js';
import { parsePagination, paginatedResponse } from '../../../utils/pagination.js';

function handleError(error: unknown, fallback = 'Database operation failed'): never {
  const message = error instanceof Error ? error.message : fallback;
  throw new Error(message);
}

export const adminService = {
  // ── Users ──────────────────────────────────────────────────
  async findAllUsers(query: Record<string, unknown>) {
    const params = parsePagination({ query });

    let baseQuery = supabase.from('users').select(
      'id, email, name, role, phone, is_active, created_at, customer:customers!customer_id(*), admin:admins!admin_id(*), delivery_agent:delivery_agents!delivery_agent_id(*)',
      { count: 'exact' },
    );

    if (query.role) baseQuery = baseQuery.eq('role', query.role as string);
    if (query.isActive !== undefined) {
      baseQuery = baseQuery.eq('is_active', query.isActive === 'true');
    }

    const { data: users, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    return paginatedResponse(users ?? [], count ?? 0, params);
  },

  async updateUser(id: string, data: { name?: string; phone?: string; role?: string; isActive?: boolean }) {
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!user) throw new NotFoundError('User not found');

    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, name, role, phone, is_active')
      .single();

    if (error) handleError(error);
    return updated;
  },

  async deleteUser(id: string) {
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!user) throw new NotFoundError('User not found');

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) handleError(error);

    return { message: 'User deleted successfully' };
  },

  // ── Warehouses ─────────────────────────────────────────────
  async findAllWarehouses(query: Record<string, unknown>) {
    const params = parsePagination({ query });

    let baseQuery = supabase.from('warehouses').select('*', { count: 'exact' });
    if (query.city) {
      baseQuery = baseQuery.ilike('city', `%${query.city as string}%`);
    }

    const { data: warehouses, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    // Fetch related counts separately for each warehouse
    const warehouseList = warehouses ?? [];
    const warehousesWithCounts = await Promise.all(
      warehouseList.map(async (w) => {
        const [branchesRes, vehiclesRes] = await Promise.all([
          supabase
            .from('branches')
            .select('*', { count: 'exact', head: true })
            .eq('warehouse_id', w.id),
          supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('current_warehouse_id', w.id),
        ]);
        return {
          ...w,
          _count: {
            branches: branchesRes.count ?? 0,
            vehiclesHere: vehiclesRes.count ?? 0,
          },
        };
      }),
    );

    return paginatedResponse(warehousesWithCounts, count ?? 0, params);
  },

  async createWarehouse(data: {
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    capacity?: number;
  }) {
    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .insert({
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        state: data.state,
        postal_code: data.postalCode,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        capacity: data.capacity ?? null,
      })
      .select()
      .single();

    if (error) handleError(error);
    return warehouse;
  },

  async updateWarehouse(id: string, data: Record<string, unknown>) {
    const { data: warehouse, error: findError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    // Map camelCase keys to snake_case
    const updateData: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      name: 'name',
      code: 'code',
      address: 'address',
      city: 'city',
      state: 'state',
      postalCode: 'postal_code',
      latitude: 'latitude',
      longitude: 'longitude',
      capacity: 'capacity',
    };
    for (const [key, value] of Object.entries(data)) {
      const dbKey = fieldMap[key] ?? key;
      updateData[dbKey] = value;
    }

    const { data: updated, error } = await supabase
      .from('warehouses')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error);
    return updated;
  },

  async deleteWarehouse(id: string) {
    const { data: warehouse, error: findError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    const { error } = await supabase.from('warehouses').delete().eq('id', id);
    if (error) handleError(error);

    return { message: 'Warehouse deleted successfully' };
  },

  // ── Branches ────────────────────────────────────────────────
  async findAllBranches(query: Record<string, unknown>) {
    const params = parsePagination({ query });

    let baseQuery = supabase.from('branches').select(
      '*, warehouse:warehouses!warehouse_id(id, name, code), manager:users!manager_id(id, name, email)',
      { count: 'exact' },
    );
    if (query.warehouseId) {
      baseQuery = baseQuery.eq('warehouse_id', query.warehouseId as string);
    }

    const { data: branches, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    // Fetch related counts separately
    const branchList = branches ?? [];
    const branchesWithCounts = await Promise.all(
      branchList.map(async (b) => {
        const [vehiclesRes, agentsRes] = await Promise.all([
          supabase
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', b.id),
          supabase
            .from('delivery_agents')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', b.id),
        ]);
        return {
          ...b,
          _count: {
            vehicles: vehiclesRes.count ?? 0,
            agents: agentsRes.count ?? 0,
          },
        };
      }),
    );

    return paginatedResponse(branchesWithCounts, count ?? 0, params);
  },

  async createBranch(data: {
    name: string;
    code: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phone?: string;
    email?: string;
    warehouseId: string;
    managerId?: string;
  }) {
    const { data: branch, error } = await supabase
      .from('branches')
      .insert({
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        state: data.state,
        postal_code: data.postalCode,
        phone: data.phone ?? null,
        email: data.email ?? null,
        warehouse_id: data.warehouseId,
        manager_id: data.managerId ?? null,
      })
      .select()
      .single();

    if (error) handleError(error);
    return branch;
  },

  async updateBranch(id: string, data: Record<string, unknown>) {
    const { data: branch, error: findError } = await supabase
      .from('branches')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!branch) throw new NotFoundError('Branch not found');

    const fieldMap: Record<string, string> = {
      name: 'name',
      code: 'code',
      address: 'address',
      city: 'city',
      state: 'state',
      postalCode: 'postal_code',
      phone: 'phone',
      email: 'email',
      warehouseId: 'warehouse_id',
      managerId: 'manager_id',
    };
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const dbKey = fieldMap[key] ?? key;
      updateData[dbKey] = value;
    }

    const { data: updated, error } = await supabase
      .from('branches')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error);
    return updated;
  },

  async deleteBranch(id: string) {
    const { data: branch, error: findError } = await supabase
      .from('branches')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!branch) throw new NotFoundError('Branch not found');

    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) handleError(error);

    return { message: 'Branch deleted successfully' };
  },

  // ── Vehicles ───────────────────────────────────────────────
  async findAllVehicles(query: Record<string, unknown>) {
    const params = parsePagination({ query });

    let baseQuery = supabase.from('vehicles').select(
      '*, branch:branches!branch_id(id, name, city), driver:delivery_agents!driver_id(id, status, user:users!user_id(id, name, phone))',
      { count: 'exact' },
    );

    if (query.status) baseQuery = baseQuery.eq('status', query.status as string);
    if (query.type) baseQuery = baseQuery.eq('type', query.type as string);
    if (query.branchId) baseQuery = baseQuery.eq('branch_id', query.branchId as string);

    const { data: vehicles, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    return paginatedResponse(vehicles ?? [], count ?? 0, params);
  },

  async createVehicle(data: {
    registration: string;
    type?: string;
    model?: string;
    capacityWeight?: number;
    capacityVolume?: number;
    branchId: string;
    currentWarehouseId?: string;
  }) {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .insert({
        registration: data.registration,
        type: (data.type as string) ?? 'VAN',
        model: data.model ?? null,
        capacity_weight: data.capacityWeight ?? 1000,
        capacity_volume: data.capacityVolume ?? null,
        branch_id: data.branchId,
        current_warehouse_id: data.currentWarehouseId ?? null,
      })
      .select()
      .single();

    if (error) handleError(error);
    return vehicle;
  },

  async updateVehicle(id: string, data: Record<string, unknown>) {
    const { data: vehicle, error: findError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const fieldMap: Record<string, string> = {
      registration: 'registration',
      type: 'type',
      model: 'model',
      capacityWeight: 'capacity_weight',
      capacityVolume: 'capacity_volume',
      branchId: 'branch_id',
      currentWarehouseId: 'current_warehouse_id',
      status: 'status',
    };
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const dbKey = fieldMap[key] ?? key;
      updateData[dbKey] = value;
    }

    const { data: updated, error } = await supabase
      .from('vehicles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error);
    return updated;
  },

  async deleteVehicle(id: string) {
    const { data: vehicle, error: findError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (findError) handleError(findError);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) handleError(error);

    return { message: 'Vehicle deleted successfully' };
  },

  // ── Audit Logs ──────────────────────────────────────────────
  async findAllAuditLogs(query: Record<string, unknown>) {
    const params = parsePagination({ query });

    let baseQuery = supabase.from('audit_logs').select(
      '*, user:users!user_id(id, name, email, role)',
      { count: 'exact' },
    );

    if (query.userId) baseQuery = baseQuery.eq('user_id', query.userId as string);
    if (query.action) baseQuery = baseQuery.eq('action', query.action as string);
    if (query.entityType) {
      baseQuery = baseQuery.eq('entity_type', query.entityType as string);
    }

    const { data: logs, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(params.skip, params.skip + params.take - 1);

    if (error) handleError(error);

    return paginatedResponse(logs ?? [], count ?? 0, params);
  },

  // ── Dashboard Stats ─────────────────────────────────────────
  async getDashboardStats() {
    const [
      totalUsersRes,
      totalShipmentsRes,
      totalVehiclesRes,
      totalWarehousesRes,
      totalBranchesRes,
      activeShipmentsRes,
      deliveredShipmentsRes,
      pendingPaymentsRes,
      usersRes,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('shipments').select('*', { count: 'exact', head: true }),
      supabase.from('vehicles').select('*', { count: 'exact', head: true }),
      supabase.from('warehouses').select('*', { count: 'exact', head: true }),
      supabase.from('branches').select('*', { count: 'exact', head: true }),
      supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .in('status', ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY']),
      supabase
        .from('shipments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'DELIVERED'),
      supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING'),
      supabase.from('users').select('role'),
    ]);

    if (totalUsersRes.error) handleError(totalUsersRes.error);

    // Aggregate usersByRole in JS since Supabase REST has no groupBy
    const usersByRole: Record<string, number> = {};
    for (const u of usersRes.data ?? []) {
      usersByRole[u.role] = (usersByRole[u.role] ?? 0) + 1;
    }

    return {
      totalUsers: totalUsersRes.count ?? 0,
      totalShipments: totalShipmentsRes.count ?? 0,
      totalVehicles: totalVehiclesRes.count ?? 0,
      totalWarehouses: totalWarehousesRes.count ?? 0,
      totalBranches: totalBranchesRes.count ?? 0,
      activeShipments: activeShipmentsRes.count ?? 0,
      deliveredShipments: deliveredShipmentsRes.count ?? 0,
      pendingPayments: pendingPaymentsRes.count ?? 0,
      usersByRole,
    };
  },
};
