/*
# Courier Management System — Complete Database Schema

## Overview
Creates the full normalized (3NF) schema for a courier management and
real-time shipment tracking system. 12 tables with proper foreign keys,
indexes, cascade rules, check constraints, and Row Level Security.

## Tables Created

1. **users** — Base authentication table (email, password hash, role).
   Uses Supabase auth.users for authentication; this table stores the
   application-level profile linked 1:1 to auth.users via the `id` column
   (which is also a foreign key to auth.users).

2. **customers** — Extended profile for customer-role users (1:1 with users).

3. **admins** — Extended profile for admin-role users (1:1 with users).

4. **delivery_agents** — Extended profile for driver/delivery-role users
   (1:1 with users). Includes license, vehicle assignment, and status.

5. **shipments** — Core shipment records with sender/recipient info,
   status, service type, weight, dimensions, and geo-coordinates.

6. **tracking_history** — Event log for each shipment (status changes,
   location updates, timestamps).

7. **notifications** — User notification records (shipment updates,
   delivery alerts, system messages).

8. **payments** — Payment records linked to shipments (amount, method,
   status, transaction reference).

9. **warehouses** — Physical storage facilities with address and capacity.

10. **branches** — Company branch offices linked to warehouses.

11. **vehicles** — Delivery vehicles assigned to branches and drivers.

12. **audit_logs** — System audit trail for all user actions.

## Enums
- user_role: ADMIN, DISPATCHER, DRIVER, CUSTOMER
- shipment_status: PENDING, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, EXCEPTION, CANCELLED
- service_type: STANDARD, EXPRESS, SAME_DAY, OVERNIGHT, FREIGHT
- tracking_event_type: CREATED, PICKED_UP, DEPARTED, IN_TRANSIT, ARRIVED, OUT_FOR_DELIVERY, DELIVERED, EXCEPTION, LOCATION_UPDATE
- notification_type: SHIPMENT_UPDATE, DELIVERY_ALERT, PAYMENT_CONFIRMATION, SYSTEM_MESSAGE
- notification_status: UNREAD, READ, ARCHIVED
- payment_status: PENDING, COMPLETED, FAILED, REFUNDED
- payment_method: CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, CASH, WALLET
- vehicle_type: VAN, TRUCK, MOTORCYCLE, BIKE, DRONE
- vehicle_status: ACTIVE, MAINTENANCE, RETIRED
- agent_status: AVAILABLE, ON_ROUTE, ON_BREAK, OFF_DUTY

## Relationships & Cascade Rules
- users → auth.users (CASCADE on delete)
- customers/admins/delivery_agents → users (CASCADE on delete)
- shipments → users as customer (SET NULL on delete — preserve shipment history)
- shipments → delivery_agents as assigned agent (SET NULL on delete)
- shipments → branches as origin/destination (SET NULL on delete)
- tracking_history → shipments (CASCADE on delete)
- tracking_history → users as recorded_by (SET NULL on delete)
- notifications → users (CASCADE on delete)
- notifications → shipments (CASCADE on delete)
- payments → shipments (CASCADE on delete)
- payments → users as customer (SET NULL on delete)
- warehouses → branches (CASCADE — warehouse owns its branches)
- branches → users as manager (SET NULL on delete)
- vehicles → branches (CASCADE on delete)
- vehicles → delivery_agents as assigned driver (SET NULL on delete)
- vehicles → warehouses as current location (SET NULL on delete)
- audit_logs → users (CASCADE on delete)

## Constraints
- CHECK on shipments.weight (> 0)
- CHECK on shipments.declared_value (>= 0)
- CHECK on payments.amount (> 0)
- CHECK on warehouses.capacity (> 0)
- CHECK on vehicles.capacity (>= 0)
- UNIQUE on shipments.tracking_number
- UNIQUE on users.email
- UNIQUE on customers.user_id / admins.user_id / delivery_agents.user_id

## Indexes
- Indexes on all foreign key columns
- Indexes on frequently-queried columns (email, tracking_number, status, etc.)
- Composite indexes for common query patterns

## Security (RLS)
- RLS enabled on all tables.
- Policies allow authenticated users to manage their own data.
- Admin-only access for admin/management tables.
*/

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('ADMIN', 'DISPATCHER', 'DRIVER', 'CUSTOMER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE shipment_status AS ENUM ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM ('STANDARD', 'EXPRESS', 'SAME_DAY', 'OVERNIGHT', 'FREIGHT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tracking_event_type AS ENUM ('CREATED', 'PICKED_UP', 'DEPARTED', 'IN_TRANSIT', 'ARRIVED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION', 'LOCATION_UPDATE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('SHIPMENT_UPDATE', 'DELIVERY_ALERT', 'PAYMENT_CONFIRMATION', 'SYSTEM_MESSAGE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM ('UNREAD', 'READ', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CASH', 'WALLET');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_type AS ENUM ('VAN', 'TRUCK', 'MOTORCYCLE', 'BIKE', 'DRONE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vehicle_status AS ENUM ('ACTIVE', 'MAINTENANCE', 'RETIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE agent_status AS ENUM ('AVAILABLE', 'ON_ROUTE', 'ON_BREAK', 'OFF_DUTY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL UNIQUE,
  password    text NOT NULL,
  name        text NOT NULL,
  role        user_role NOT NULL DEFAULT 'CUSTOMER',
  phone       text,
  avatar_url  text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users
  ADD CONSTRAINT fk_users_auth FOREIGN KEY (id)
  REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT chk_users_email CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$');

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================================
-- 2. CUSTOMERS
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE,
  company_name    text,
  company_reg     text,
  billing_address text,
  default_address text,
  credit_limit    numeric(12,2) DEFAULT 0,
  total_shipments  integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customers
  ADD CONSTRAINT fk_customers_user FOREIGN KEY (user_id)
  REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT chk_customers_credit CHECK (credit_limit >= 0);

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- ============================================================
-- 3. ADMINS
-- ============================================================

CREATE TABLE IF NOT EXISTS admins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL UNIQUE,
  department      text,
  access_level    integer NOT NULL DEFAULT 1,
  permissions     text[] DEFAULT '{}',
  last_login_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admins
  ADD CONSTRAINT fk_admins_user FOREIGN KEY (user_id)
  REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT chk_admins_access CHECK (access_level >= 1 AND access_level <= 5);

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);

-- ============================================================
-- 4. DELIVERY_AGENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS delivery_agents (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL UNIQUE,
  license_number    text,
  license_expiry    date,
  vehicle_id        uuid,
  status            agent_status NOT NULL DEFAULT 'OFF_DUTY',
  rating            numeric(3,2) DEFAULT 0,
  total_deliveries  integer NOT NULL DEFAULT 0,
  current_latitude  double precision,
  current_longitude double precision,
  branch_id         uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE delivery_agents
  ADD CONSTRAINT fk_agents_user FOREIGN KEY (user_id)
  REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT chk_agents_rating CHECK (rating >= 0 AND rating <= 5);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON delivery_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON delivery_agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_branch ON delivery_agents(branch_id);

-- ============================================================
-- 5. WAREHOUSES  (created before branches — branches reference it)
-- ============================================================

CREATE TABLE IF NOT EXISTS warehouses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  code        text NOT NULL UNIQUE,
  address     text NOT NULL,
  city        text NOT NULL,
  state       text NOT NULL,
  postal_code text NOT NULL,
  country     text NOT NULL DEFAULT 'USA',
  latitude    double precision,
  longitude   double precision,
  capacity    integer NOT NULL DEFAULT 1000,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE warehouses
  ADD CONSTRAINT chk_warehouses_capacity CHECK (capacity > 0);

CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);

-- ============================================================
-- 6. BRANCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS branches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  code          text NOT NULL UNIQUE,
  address       text NOT NULL,
  city          text NOT NULL,
  state         text NOT NULL,
  postal_code   text NOT NULL,
  phone         text,
  email         text,
  warehouse_id  uuid NOT NULL,
  manager_id    uuid,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE branches
  ADD CONSTRAINT fk_branches_warehouse FOREIGN KEY (warehouse_id)
  REFERENCES warehouses(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_branches_manager FOREIGN KEY (manager_id)
  REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_branches_warehouse ON branches(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_branches_manager ON branches(manager_id);
CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(code);

-- Now link delivery_agents.branch_id to branches.id
DO $$ BEGIN
  ALTER TABLE delivery_agents
    ADD CONSTRAINT fk_agents_branch FOREIGN KEY (branch_id)
    REFERENCES branches(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 7. VEHICLES
-- ============================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration    text NOT NULL UNIQUE,
  type            vehicle_type NOT NULL DEFAULT 'VAN',
  model            text,
  capacity_weight numeric(10,2) NOT NULL DEFAULT 1000,
  capacity_volume numeric(10,2) DEFAULT 0,
  status          vehicle_status NOT NULL DEFAULT 'ACTIVE',
  branch_id       uuid NOT NULL,
  driver_id       uuid,
  current_warehouse_id uuid,
  last_service_at date,
  next_service_at date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vehicles
  ADD CONSTRAINT fk_vehicles_branch FOREIGN KEY (branch_id)
  REFERENCES branches(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_vehicles_driver FOREIGN KEY (driver_id)
  REFERENCES delivery_agents(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_vehicles_warehouse FOREIGN KEY (current_warehouse_id)
  REFERENCES warehouses(id) ON DELETE SET NULL,
  ADD CONSTRAINT chk_vehicles_capacity CHECK (capacity_weight >= 0);

CREATE INDEX IF NOT EXISTS idx_vehicles_branch ON vehicles(branch_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration);

-- Link delivery_agents.vehicle_id to vehicles.id
DO $$ BEGIN
  ALTER TABLE delivery_agents
    ADD CONSTRAINT fk_agents_vehicle FOREIGN KEY (vehicle_id)
    REFERENCES vehicles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_agents_vehicle ON delivery_agents(vehicle_id);

-- ============================================================
-- 8. SHIPMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS shipments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number       text NOT NULL UNIQUE,
  status                shipment_status NOT NULL DEFAULT 'PENDING',
  service_type          service_type NOT NULL DEFAULT 'STANDARD',

  -- Sender
  sender_name           text NOT NULL,
  sender_phone          text NOT NULL,
  sender_address        text NOT NULL,
  sender_city           text NOT NULL,
  sender_state          text NOT NULL,
  sender_postal_code    text NOT NULL,
  sender_latitude       double precision,
  sender_longitude      double precision,

  -- Recipient
  recipient_name        text NOT NULL,
  recipient_phone       text NOT NULL,
  recipient_address     text NOT NULL,
  recipient_city        text NOT NULL,
  recipient_state       text NOT NULL,
  recipient_postal_code text NOT NULL,
  recipient_latitude    double precision,
  recipient_longitude   double precision,

  -- Package
  weight                numeric(10,2) NOT NULL,
  dimensions            text,
  declared_value        numeric(12,2) DEFAULT 0,
  notes                 text,

  -- Delivery
  estimated_delivery    timestamptz,
  actual_delivery       timestamptz,
  current_latitude      double precision,
  current_longitude     double precision,

  -- Relationships
  customer_id           uuid,
  assigned_agent_id     uuid,
  origin_branch_id      uuid,
  destination_branch_id uuid,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE shipments
  ADD CONSTRAINT fk_shipments_customer FOREIGN KEY (customer_id)
  REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_shipments_agent FOREIGN KEY (assigned_agent_id)
  REFERENCES delivery_agents(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_shipments_origin_branch FOREIGN KEY (origin_branch_id)
  REFERENCES branches(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_shipments_dest_branch FOREIGN KEY (destination_branch_id)
  REFERENCES branches(id) ON DELETE SET NULL,
  ADD CONSTRAINT chk_shipments_weight CHECK (weight > 0),
  ADD CONSTRAINT chk_shipments_value CHECK (declared_value >= 0);

CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_customer ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_agent ON shipments(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_origin_branch ON shipments(origin_branch_id);
CREATE INDEX IF NOT EXISTS idx_shipments_dest_branch ON shipments(destination_branch_id);
CREATE INDEX IF NOT EXISTS idx_shipments_created ON shipments(created_at);

-- ============================================================
-- 9. TRACKING_HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS tracking_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id   uuid NOT NULL,
  event_type    tracking_event_type NOT NULL,
  message       text NOT NULL,
  latitude      double precision,
  longitude     double precision,
  city          text,
  recorded_by   uuid,
  timestamp     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tracking_history
  ADD CONSTRAINT fk_tracking_shipment FOREIGN KEY (shipment_id)
  REFERENCES shipments(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_tracking_recorded_by FOREIGN KEY (recorded_by)
  REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tracking_shipment ON tracking_history(shipment_id);
CREATE INDEX IF NOT EXISTS idx_tracking_timestamp ON tracking_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_tracking_event_type ON tracking_history(event_type);

-- ============================================================
-- 10. NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL,
  shipment_id   uuid,
  type          notification_type NOT NULL DEFAULT 'SHIPMENT_UPDATE',
  status        notification_status NOT NULL DEFAULT 'UNREAD',
  title         text NOT NULL,
  message       text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  read_at       timestamptz
);

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
  REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_notifications_shipment FOREIGN KEY (shipment_id)
  REFERENCES shipments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_shipment ON notifications(shipment_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- ============================================================
-- 11. PAYMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id         uuid NOT NULL,
  customer_id         uuid,
  amount              numeric(12,2) NOT NULL,
  currency            text NOT NULL DEFAULT 'USD',
  method              payment_method NOT NULL DEFAULT 'CREDIT_CARD',
  status              payment_status NOT NULL DEFAULT 'PENDING',
  transaction_ref     text,
  payment_date        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_shipment FOREIGN KEY (shipment_id)
  REFERENCES shipments(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_payments_customer FOREIGN KEY (customer_id)
  REFERENCES users(id) ON DELETE SET NULL,
  ADD CONSTRAINT chk_payments_amount CHECK (amount > 0);

CREATE INDEX IF NOT EXISTS idx_payments_shipment ON payments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON payments(method);

-- ============================================================
-- 12. AUDIT_LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     uuid,
  old_values    jsonb,
  new_values    jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
  REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ── users policies ──────────────────────────────────────────
DROP POLICY IF EXISTS "select_own_profile" ON users;
CREATE POLICY "select_own_profile" ON users FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON users;
CREATE POLICY "update_own_profile" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "admin_select_all_users" ON users;
CREATE POLICY "admin_select_all_users" ON users FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ── customers policies ──────────────────────────────────────
DROP POLICY IF EXISTS "select_own_customer" ON customers;
CREATE POLICY "select_own_customer" ON customers FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_customer" ON customers;
CREATE POLICY "update_own_customer" ON customers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_customers" ON customers;
CREATE POLICY "admin_select_all_customers" ON customers FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ── admins policies (admin-only) ────────────────────────────
DROP POLICY IF EXISTS "admin_select_admins" ON admins;
CREATE POLICY "admin_select_admins" ON admins FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid())
  );

-- ── delivery_agents policies ────────────────────────────────
DROP POLICY IF EXISTS "select_own_agent_profile" ON delivery_agents;
CREATE POLICY "select_own_agent_profile" ON delivery_agents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_agent_profile" ON delivery_agents;
CREATE POLICY "update_own_agent_profile" ON delivery_agents FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admin_select_all_agents" ON delivery_agents;
CREATE POLICY "admin_select_all_agents" ON delivery_agents FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ── shipments policies ──────────────────────────────────────
DROP POLICY IF EXISTS "select_own_shipments" ON shipments;
CREATE POLICY "select_own_shipments" ON shipments FOR SELECT
  TO authenticated USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "agent_select_assigned_shipments" ON shipments;
CREATE POLICY "agent_select_assigned_shipments" ON shipments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM delivery_agents da
     WHERE da.user_id = auth.uid() AND da.id = shipments.assigned_agent_id)
  );

DROP POLICY IF EXISTS "admin_select_all_shipments" ON shipments;
CREATE POLICY "admin_select_all_shipments" ON shipments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "customer_insert_shipments" ON shipments;
CREATE POLICY "customer_insert_shipments" ON shipments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "customer_update_shipments" ON shipments;
CREATE POLICY "customer_update_shipments" ON shipments FOR UPDATE
  TO authenticated USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "admin_manage_shipments" ON shipments;
CREATE POLICY "admin_manage_shipments" ON shipments FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ── tracking_history policies ───────────────────────────────
DROP POLICY IF EXISTS "select_tracking_own_shipments" ON tracking_history;
CREATE POLICY "select_tracking_own_shipments" ON tracking_history FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM shipments s
     WHERE s.id = tracking_history.shipment_id
       AND (s.customer_id = auth.uid()
            OR EXISTS (SELECT 1 FROM delivery_agents da
                        WHERE da.user_id = auth.uid() AND da.id = s.assigned_agent_id)))
  );

DROP POLICY IF EXISTS "admin_select_all_tracking" ON tracking_history;
CREATE POLICY "admin_select_all_tracking" ON tracking_history FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_insert_tracking" ON tracking_history;
CREATE POLICY "admin_insert_tracking" ON tracking_history FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ── notifications policies ───────────────────────────────────
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── payments policies ────────────────────────────────────────
DROP POLICY IF EXISTS "select_own_payments" ON payments;
CREATE POLICY "select_own_payments" ON payments FOR SELECT
  TO authenticated USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "admin_select_all_payments" ON payments;
CREATE POLICY "admin_select_all_payments" ON payments FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ── warehouses policies (admin-only) ─────────────────────────
DROP POLICY IF EXISTS "admin_select_warehouses" ON warehouses;
CREATE POLICY "admin_select_warehouses" ON warehouses FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_manage_warehouses" ON warehouses;
CREATE POLICY "admin_manage_warehouses" ON warehouses FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ── branches policies (admin-only) ───────────────────────────
DROP POLICY IF EXISTS "admin_select_branches" ON branches;
CREATE POLICY "admin_select_branches" ON branches FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_manage_branches" ON branches;
CREATE POLICY "admin_manage_branches" ON branches FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ── vehicles policies (admin-only) ───────────────────────────
DROP POLICY IF EXISTS "admin_select_vehicles" ON vehicles;
CREATE POLICY "admin_select_vehicles" ON vehicles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "admin_manage_vehicles" ON vehicles;
CREATE POLICY "admin_manage_vehicles" ON vehicles FOR ALL
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ── audit_logs policies (admin-only) ─────────────────────────
DROP POLICY IF EXISTS "admin_select_audit_logs" ON audit_logs;
CREATE POLICY "admin_select_audit_logs" ON audit_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );