import { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  Package,
  Building2,
  Truck,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Search,
  Plus,
  Download,
  Filter,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Input } from '@/components/ui';
import { dataStore } from '@/lib/dataStore';
import type { Shipment, User, Warehouse, Vehicle, Payment, AuditLog, Role } from '@/types';
import { formatCurrency, formatDate } from '@/utils/formatters';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'shipments' | 'users' | 'warehouses' | 'vehicles' | 'payments' | 'audit'
  >('analytics');

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & Pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Modals for adding
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('DRIVER');

  useEffect(() => {
    const loadAll = () => {
      setShipments(dataStore.getShipments());
      setUsers(dataStore.getUsers());
      setWarehouses(dataStore.getWarehouses());
      setVehicles(dataStore.getVehicles());
      setPayments(dataStore.getPayments());
      setAuditLogs(dataStore.getAuditLogs());
    };

    loadAll();
    const unsub = dataStore.subscribe(loadAll);
    return () => unsub();
  }, []);

  // Export CSV Function
  const exportToCsv = (filename: string, rows: object[]) => {
    if (!rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]!);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map((row) =>
          keys
            .map((k) => {
              let cell = (row as any)[k] ?? '';
              cell = cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator),
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    dataStore.addUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      isActive: true,
      phone: '+1 (555) 000-9988',
    });
    setNewUserName('');
    setNewUserEmail('');
    setIsAddUserOpen(false);
  };

  // Recharts Mock Analytics Data
  const volumeData = [
    { day: 'Mon', shipments: 240, delivered: 210 },
    { day: 'Tue', shipments: 320, delivered: 290 },
    { day: 'Wed', shipments: 450, delivered: 410 },
    { day: 'Thu', shipments: 380, delivered: 350 },
    { day: 'Fri', shipments: 520, delivered: 480 },
    { day: 'Sat', shipments: 290, delivered: 270 },
    { day: 'Sun', shipments: 190, delivered: 180 },
  ];

  const statusPieData = [
    { name: 'Delivered', value: shipments.filter((s) => s.status === 'DELIVERED').length || 1 },
    { name: 'In Transit', value: shipments.filter((s) => s.status === 'IN_TRANSIT').length || 1 },
    { name: 'Out For Delivery', value: shipments.filter((s) => s.status === 'OUT_FOR_DELIVERY').length || 1 },
    { name: 'Warehouse / Pending', value: shipments.filter((s) => ['CREATED', 'PENDING', 'WAREHOUSE'].includes(s.status)).length || 1 },
  ];
  const PIE_COLORS = ['#22c55e', '#3b66f6', '#f59e0b', '#64748b'];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Title Bar */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-surface-900 via-surface-800 to-primary-950 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between border border-surface-800">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Enterprise Control Center</h1>
          <p className="mt-1 text-xs text-surface-300">
            Global fleet management, real-time analytics, financial audits & security logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => exportToCsv('shipments_report.csv', shipments)}
            className="bg-white/10 hover:bg-white/20 text-white font-bold"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export All Data
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-200 pb-2 dark:border-surface-800">
        {[
          { id: 'analytics', label: 'Analytics & KPIs', icon: BarChart3 },
          { id: 'shipments', label: `Shipments (${shipments.length})`, icon: Package },
          { id: 'users', label: `Users (${users.length})`, icon: Users },
          { id: 'warehouses', label: `Warehouses (${warehouses.length})`, icon: Building2 },
          { id: 'vehicles', label: `Fleet (${vehicles.length})`, icon: Truck },
          { id: 'payments', label: `Payments`, icon: CreditCard },
          { id: 'audit', label: `Audit Logs`, icon: ShieldCheck },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setPage(1);
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow'
                : 'text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-surface-400">Total System Revenue</p>
                <p className="mt-1 text-2xl font-black text-surface-900 dark:text-surface-100">$18,490.50</p>
                <p className="mt-2 text-2xs text-success-600 font-bold">+18.4% vs last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-surface-400">On-Time Delivery Rate</p>
                <p className="mt-1 text-2xl font-black text-success-600">98.2%</p>
                <p className="mt-2 text-2xs text-surface-400">Avg transit 1.8 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-surface-400">Active Warehouses</p>
                <p className="mt-1 text-2xl font-black text-surface-900 dark:text-surface-100">{warehouses.length}</p>
                <p className="mt-2 text-2xs text-surface-400">109,440 packages stored</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-medium text-surface-400">Fleet Availability</p>
                <p className="mt-1 text-2xl font-black text-primary-600">83.3%</p>
                <p className="mt-2 text-2xs text-surface-400">3 Active Drivers</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Shipment Volume & Deliveries Trend</CardTitle>
                <CardDescription>Daily package throughput over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeData}>
                      <defs>
                        <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b66f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b66f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="shipments"
                        stroke="#3b66f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorShipments)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Breakdown</CardTitle>
                <CardDescription>Current package lifecycle distribution</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusPieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-2xs">
                  {statusPieData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-surface-600 dark:text-surface-300 font-medium">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL SHIPMENTS MANAGEMENT */}
      {activeTab === 'shipments' && (
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Global Shipments Registry</CardTitle>
              <CardDescription>Search, filter, assign drivers, and manage all active orders</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="w-full sm:w-64"
                placeholder="Search tracking, sender, recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportToCsv('shipments_registry.csv', shipments)}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Export CSV
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-surface-200 bg-surface-50 font-bold uppercase tracking-wider text-surface-500 dark:border-surface-800 dark:bg-surface-800/60 dark:text-surface-400">
                  <tr>
                    <th className="px-4 py-3">Tracking Number</th>
                    <th className="px-4 py-3">Sender</th>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Assigned Driver</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                  {shipments.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="px-4 py-3 font-mono font-bold text-surface-900 dark:text-surface-100">
                        {s.trackingNumber}
                      </td>
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300">{s.senderName}</td>
                      <td className="px-4 py-3 text-surface-700 dark:text-surface-300">
                        {s.recipientName} ({s.recipientCity})
                      </td>
                      <td className="px-4 py-3">
                        {s.assignedDriverName ? (
                          <span className="font-semibold text-primary-600 dark:text-primary-400">
                            {s.assignedDriverName}
                          </span>
                        ) : (
                          <button
                            onClick={() => dataStore.assignDriver(s.id, 'usr_agent1', 'Alex Rivera (Agent)')}
                            className="text-2xs font-bold text-accent-600 hover:underline"
                          >
                            + Assign Alex Rivera
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="primary">{s.status.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 font-bold text-surface-900 dark:text-surface-100">
                        {formatCurrency(s.price || 35)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select
                          value={s.status}
                          onChange={(e) =>
                            dataStore.updateShipmentStatus(
                              s.id,
                              e.target.value as any,
                              `Status updated to ${e.target.value} by Admin`,
                              s.recipientCity,
                              { id: 'usr_admin', name: 'Admin', role: 'ADMIN' },
                            )
                          }
                          className="h-7 rounded border border-surface-300 bg-white px-2 text-2xs text-surface-900 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
                        >
                          <option value="CREATED">CREATED</option>
                          <option value="PICKED_UP">PICKED_UP</option>
                          <option value="WAREHOUSE">WAREHOUSE</option>
                          <option value="SORTING_FACILITY">SORTING_FACILITY</option>
                          <option value="IN_TRANSIT">IN_TRANSIT</option>
                          <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage administrators, dispatchers, drivers, and customers</CardDescription>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsAddUserOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add User
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-surface-200 bg-surface-50 font-bold uppercase tracking-wider text-surface-500 dark:border-surface-800 dark:bg-surface-800/60 dark:text-surface-400">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Toggle Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="px-4 py-3 font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-2xs">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            u.role === 'ADMIN'
                              ? 'error'
                              : u.role === 'DRIVER'
                              ? 'primary'
                              : u.role === 'DISPATCHER'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{u.phone || 'N/A'}</td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 font-bold text-success-600 text-2xs">
                            <UserCheck className="h-3.5 w-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-error-600 text-2xs">
                            <UserX className="h-3.5 w-3.5" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dataStore.toggleUserActive(u.id)}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 4: WAREHOUSES */}
      {activeTab === 'warehouses' && (
        <div className="grid gap-4 sm:grid-cols-3">
          {warehouses.map((wh) => (
            <Card key={wh.id} hoverable>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="primary">{wh.code}</Badge>
                  <Badge variant="success">{wh.status}</Badge>
                </div>
                <CardTitle className="mt-2">{wh.name}</CardTitle>
                <CardDescription>{wh.address}, {wh.city}, {wh.state}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between text-surface-600 dark:text-surface-300">
                  <span>Capacity:</span>
                  <span className="font-bold">{wh.currentPackages.toLocaleString()} / {wh.capacity.toLocaleString()} pkgs</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden">
                  <div
                    className="h-full bg-primary-600"
                    style={{ width: `${Math.min(100, (wh.currentPackages / wh.capacity) * 100)}%` }}
                  />
                </div>
                <p className="text-2xs text-surface-400 mt-2">Manager: {wh.managerName} ({wh.contactPhone})</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 5: FLEET */}
      {activeTab === 'vehicles' && (
        <div className="grid gap-4 sm:grid-cols-3">
          {vehicles.map((v) => (
            <Card key={v.id} hoverable>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-surface-900 dark:text-surface-100">{v.code}</span>
                  <Badge variant={v.status === 'EN_ROUTE' ? 'primary' : 'success'}>{v.status}</Badge>
                </div>
                <CardTitle className="mt-2">{v.type} — {v.plateNumber}</CardTitle>
                <CardDescription>Payload Capacity: {v.capacityKg} kg</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="text-surface-600 dark:text-surface-300 font-medium">
                  Driver: {v.driverName || 'Unassigned'}
                </p>
                <div className="flex justify-between text-2xs text-surface-400">
                  <span>Fuel Level:</span>
                  <span className="font-bold text-surface-800 dark:text-surface-200">{v.fuelLevel}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-200 dark:bg-surface-800 overflow-hidden">
                  <div
                    className={`h-full ${v.fuelLevel > 30 ? 'bg-success-500' : 'bg-error-500'}`}
                    style={{ width: `${v.fuelLevel}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 6: PAYMENTS */}
      {activeTab === 'payments' && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Transactions & Revenue</CardTitle>
            <CardDescription>All customer payments and service charges</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-surface-200 bg-surface-50 font-bold uppercase tracking-wider text-surface-500 dark:border-surface-800 dark:bg-surface-800/60 dark:text-surface-400">
                  <tr>
                    <th className="px-4 py-3">Transaction ID</th>
                    <th className="px-4 py-3">Tracking Number</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="px-4 py-3 font-mono font-bold text-surface-900 dark:text-surface-100">{p.id}</td>
                      <td className="px-4 py-3 font-mono">{p.trackingNumber}</td>
                      <td className="px-4 py-3 font-medium">{p.customerName}</td>
                      <td className="px-4 py-3 text-surface-600 dark:text-surface-400">{p.paymentMethod}</td>
                      <td className="px-4 py-3 font-bold text-success-600 dark:text-success-400">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="success">{p.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-surface-400">{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>System Security & Audit Logs</CardTitle>
            <CardDescription>Track state changes, driver assignments, and administrative actions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-surface-200 bg-surface-50 font-bold uppercase tracking-wider text-surface-500 dark:border-surface-800 dark:bg-surface-800/60 dark:text-surface-400">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity ID</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/30">
                      <td className="px-4 py-3 text-surface-400 whitespace-nowrap">{formatDate(log.timestamp)}</td>
                      <td className="px-4 py-3 font-bold text-surface-900 dark:text-surface-100">{log.userName}</td>
                      <td className="px-4 py-3">
                        <Badge variant="primary">{log.userRole}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-2xs font-bold text-primary-600 dark:text-primary-400">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 font-mono">{log.entityId}</td>
                      <td className="px-4 py-3 text-surface-600 dark:text-surface-300">{log.details}</td>
                      <td className="px-4 py-3 font-mono text-2xs text-surface-400">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-2xl dark:border-surface-800 dark:bg-surface-900">
            <h3 className="text-base font-bold text-surface-900 dark:text-surface-100">Add New System User</h3>
            <form onSubmit={handleAddUserSubmit} className="mt-4 space-y-3">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="jane@courieros.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                  System Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="h-9 w-full rounded-lg border border-surface-300 bg-white px-3 text-xs dark:border-surface-700 dark:bg-surface-800 dark:text-surface-100"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="DRIVER">DRIVER / AGENT</option>
                  <option value="DISPATCHER">DISPATCHER</option>
                  <option value="ADMIN">ADMINISTRATOR</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="outline" type="button" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create User</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
