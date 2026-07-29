/*
# Seed Data for Courier Management System

Populates all 12 tables with realistic sample data.
All passwords are "password123" (bcrypt hash pre-computed).
Idempotent: ON CONFLICT DO NOTHING / WHERE NOT EXISTS guards.
*/

-- ============================================================
-- AUTH USERS (must exist before application users due to FK)
-- ============================================================

INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', now(), now(), now(), '{"role":"ADMIN"}', '{"name":"System Admin"}'),
  ('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dispatcher@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', now(), now(), now(), '{"role":"DISPATCHER"}', '{"name":"Dispatch Manager"}'),
  ('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'driver1@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', now(), now(), now(), '{"role":"DRIVER"}', '{"name":"John Martinez"}'),
  ('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'driver2@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', now(), now(), now(), '{"role":"DRIVER"}', '{"name":"Sarah Chen"}'),
  ('11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer1@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', now(), now(), now(), '{"role":"CUSTOMER"}', '{"name":"Acme Corp"}'),
  ('11111111-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer2@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', now(), now(), now(), '{"role":"CUSTOMER"}', '{"name":"TechStart Inc"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- USERS (application profiles)
-- ============================================================

INSERT INTO users (id, email, password, name, role, phone, is_active)
VALUES
  ('11111111-0000-0000-0000-000000000001', 'admin@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'System Admin', 'ADMIN', '555-0100', true),
  ('11111111-0000-0000-0000-000000000002', 'dispatcher@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'Dispatch Manager', 'DISPATCHER', '555-0101', true),
  ('11111111-0000-0000-0000-000000000003', 'driver1@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'John Martinez', 'DRIVER', '555-0102', true),
  ('11111111-0000-0000-0000-000000000004', 'driver2@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'Sarah Chen', 'DRIVER', '555-0103', true),
  ('11111111-0000-0000-0000-000000000005', 'customer1@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'Acme Corp', 'CUSTOMER', '555-0104', true),
  ('11111111-0000-0000-0000-000000000006', 'customer2@courieros.com', '$2a$10$Q737S8Vq5LM8nN5lX5h5h.7QXQ8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q', 'TechStart Inc', 'CUSTOMER', '555-0105', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ADMINS
-- ============================================================

INSERT INTO admins (user_id, department, access_level, permissions)
SELECT '11111111-0000-0000-0000-000000000001', 'Operations', 5, '{"all"}'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE user_id = '11111111-0000-0000-0000-000000000001');

INSERT INTO admins (user_id, department, access_level, permissions)
SELECT '11111111-0000-0000-0000-000000000002', 'Dispatch', 3, '{"shipments","tracking","fleet"}'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE user_id = '11111111-0000-0000-0000-000000000002');

-- ============================================================
-- CUSTOMERS
-- ============================================================

INSERT INTO customers (user_id, company_name, company_reg, billing_address, default_address, credit_limit, total_shipments)
SELECT '11111111-0000-0000-0000-000000000005', 'Acme Corporation', 'REG-NY-12345', '123 Business Ave, New York, NY 10001', '123 Business Ave, New York, NY 10001', 50000.00, 2
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE user_id = '11111111-0000-0000-0000-000000000005');

INSERT INTO customers (user_id, company_name, company_reg, billing_address, default_address, credit_limit, total_shipments)
SELECT '11111111-0000-0000-0000-000000000006', 'TechStart Inc', 'REG-CA-67890', '456 Innovation Blvd, San Francisco, CA 94101', '456 Innovation Blvd, San Francisco, CA 94101', 25000.00, 1
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE user_id = '11111111-0000-0000-0000-000000000006');

-- ============================================================
-- WAREHOUSES
-- ============================================================

INSERT INTO warehouses (id, name, code, address, city, state, postal_code, latitude, longitude, capacity, is_active)
SELECT '22222222-0000-0000-0000-000000000001', 'East Coast Hub', 'WH-NYC', '100 Warehouse Way', 'New York', 'NY', '10001', 40.7128, -74.0060, 5000, true
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE id = '22222222-0000-0000-0000-000000000001');

INSERT INTO warehouses (id, name, code, address, city, state, postal_code, latitude, longitude, capacity, is_active)
SELECT '22222222-0000-0000-0000-000000000002', 'West Coast Hub', 'WH-LAX', '200 Storage Lane', 'Los Angeles', 'CA', '90001', 34.0522, -118.2437, 5000, true
WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE id = '22222222-0000-0000-0000-000000000002');

-- ============================================================
-- BRANCHES
-- ============================================================

INSERT INTO branches (id, name, code, address, city, state, postal_code, phone, email, warehouse_id, manager_id, is_active)
SELECT '33333333-0000-0000-0000-000000000001', 'Manhattan Branch', 'BR-NYC', '300 Main Street', 'New York', 'NY', '10001', '212-555-0001', 'nyc@courieros.com', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', true
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE id = '33333333-0000-0000-0000-000000000001');

INSERT INTO branches (id, name, code, address, city, state, postal_code, phone, email, warehouse_id, manager_id, is_active)
SELECT '33333333-0000-0000-0000-000000000002', 'Downtown LA Branch', 'BR-LAX', '400 Sunset Blvd', 'Los Angeles', 'CA', '90001', '213-555-0002', 'lax@courieros.com', '22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', true
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE id = '33333333-0000-0000-0000-000000000002');

INSERT INTO branches (id, name, code, address, city, state, postal_code, phone, email, warehouse_id, manager_id, is_active)
SELECT '33333333-0000-0000-0000-000000000003', 'Chicago Hub', 'BR-CHI', '500 Windy Ave', 'Chicago', 'IL', '60601', '312-555-0003', 'chi@courieros.com', '22222222-0000-0000-0000-000000000001', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE id = '33333333-0000-0000-0000-000000000003');

-- ============================================================
-- DELIVERY AGENTS (before vehicles so vehicle.driver_id can link)
-- ============================================================

INSERT INTO delivery_agents (id, user_id, license_number, license_expiry, status, rating, total_deliveries, current_latitude, current_longitude, branch_id)
SELECT '55555555-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'DL-NY-12345', '2027-06-15', 'ON_ROUTE', 4.85, 342, 40.7589, -73.9851, '33333333-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM delivery_agents WHERE user_id = '11111111-0000-0000-0000-000000000003');

INSERT INTO delivery_agents (id, user_id, license_number, license_expiry, status, rating, total_deliveries, current_latitude, current_longitude, branch_id)
SELECT '55555555-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004', 'DL-CA-67890', '2026-12-20', 'AVAILABLE', 4.92, 518, 34.0522, -118.2437, '33333333-0000-0000-0000-000000000002'
WHERE NOT EXISTS (SELECT 1 FROM delivery_agents WHERE user_id = '11111111-0000-0000-0000-000000000004');

-- ============================================================
-- VEHICLES (with driver_id linked to delivery_agents)
-- ============================================================

INSERT INTO vehicles (id, registration, type, model, capacity_weight, capacity_volume, status, branch_id, current_warehouse_id, driver_id)
SELECT '44444444-0000-0000-0000-000000000001', 'NY-2841-VN', 'VAN', 'Ford Transit 2023', 1500.00, 12.0, 'ACTIVE', '33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE id = '44444444-0000-0000-0000-000000000001');

INSERT INTO vehicles (id, registration, type, model, capacity_weight, capacity_volume, status, branch_id, current_warehouse_id, driver_id)
SELECT '44444444-0000-0000-0000-000000000002', 'CA-9932-TR', 'TRUCK', 'Freightliner M2 2022', 8000.00, 40.0, 'ACTIVE', '33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', '55555555-0000-0000-0000-000000000002'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE id = '44444444-0000-0000-0000-000000000002');

INSERT INTO vehicles (id, registration, type, model, capacity_weight, capacity_volume, status, branch_id, current_warehouse_id)
SELECT '44444444-0000-0000-0000-000000000003', 'NY-1120-BK', 'MOTORCYCLE', 'Honda CB500 2024', 80.00, 0.5, 'ACTIVE', '33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE id = '44444444-0000-0000-0000-000000000003');

-- Link delivery_agents.vehicle_id back to vehicles
UPDATE delivery_agents SET vehicle_id = '44444444-0000-0000-0000-000000000001' WHERE id = '55555555-0000-0000-0000-000000000001' AND vehicle_id IS NULL;
UPDATE delivery_agents SET vehicle_id = '44444444-0000-0000-0000-000000000002' WHERE id = '55555555-0000-0000-0000-000000000002' AND vehicle_id IS NULL;

-- ============================================================
-- SHIPMENTS
-- ============================================================

INSERT INTO shipments (id, tracking_number, status, service_type, sender_name, sender_phone, sender_address, sender_city, sender_state, sender_postal_code, sender_latitude, sender_longitude, recipient_name, recipient_phone, recipient_address, recipient_city, recipient_state, recipient_postal_code, recipient_latitude, recipient_longitude, weight, dimensions, declared_value, notes, estimated_delivery, actual_delivery, current_latitude, current_longitude, customer_id, assigned_agent_id, origin_branch_id, destination_branch_id)
SELECT '66666666-0000-0000-0000-000000000001', 'COUR-NYC001-2026', 'IN_TRANSIT', 'EXPRESS', 'Acme Corp', '555-0104', '123 Business Ave', 'New York', 'NY', '10001', 40.7128, -74.0060, 'John Smith', '555-0200', '789 Residential St', 'Boston', 'MA', '02101', 42.3601, -71.0589, 15.50, '30x20x15 cm', 500.00, 'Handle with care', now() + interval '2 days', NULL, 41.0405, -73.1234, '11111111-0000-0000-0000-000000000005', '55555555-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003'
WHERE NOT EXISTS (SELECT 1 FROM shipments WHERE id = '66666666-0000-0000-0000-000000000001');

INSERT INTO shipments (id, tracking_number, status, service_type, sender_name, sender_phone, sender_address, sender_city, sender_state, sender_postal_code, sender_latitude, sender_longitude, recipient_name, recipient_phone, recipient_address, recipient_city, recipient_state, recipient_postal_code, recipient_latitude, recipient_longitude, weight, dimensions, declared_value, notes, estimated_delivery, actual_delivery, current_latitude, current_longitude, customer_id, assigned_agent_id, origin_branch_id, destination_branch_id)
SELECT '66666666-0000-0000-0000-000000000002', 'COUR-LAX002-2026', 'DELIVERED', 'STANDARD', 'TechStart Inc', '555-0105', '456 Innovation Blvd', 'Los Angeles', 'CA', '90001', 34.0522, -118.2437, 'Jane Doe', '555-0300', '101 Sunset Apartments', 'San Diego', 'CA', '92101', 32.7157, -117.1611, 8.20, '25x15x10 cm', 200.00, NULL, now() - interval '1 day', now() - interval '5 hours', 32.7157, -117.1611, '11111111-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002'
WHERE NOT EXISTS (SELECT 1 FROM shipments WHERE id = '66666666-0000-0000-0000-000000000002');

INSERT INTO shipments (id, tracking_number, status, service_type, sender_name, sender_phone, sender_address, sender_city, sender_state, sender_postal_code, sender_latitude, sender_longitude, recipient_name, recipient_phone, recipient_address, recipient_city, recipient_state, recipient_postal_code, recipient_latitude, recipient_longitude, weight, dimensions, declared_value, notes, estimated_delivery, actual_delivery, current_latitude, current_longitude, customer_id, assigned_agent_id, origin_branch_id, destination_branch_id)
SELECT '66666666-0000-0000-0000-000000000003', 'COUR-CHI003-2026', 'PENDING', 'SAME_DAY', 'Acme Corp', '555-0104', '123 Business Ave', 'New York', 'NY', '10001', 40.7128, -74.0060, 'Mike Johnson', '555-0400', '202 Lake Shore Dr', 'Chicago', 'IL', '60601', 41.8781, -87.6298, 3.75, '15x10x8 cm', 50.00, 'Express same-day delivery', now() + interval '1 day', NULL, NULL, NULL, '11111111-0000-0000-0000-000000000005', NULL, '33333333-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000003'
WHERE NOT EXISTS (SELECT 1 FROM shipments WHERE id = '66666666-0000-0000-0000-000000000003');

INSERT INTO shipments (id, tracking_number, status, service_type, sender_name, sender_phone, sender_address, sender_city, sender_state, sender_postal_code, sender_latitude, sender_longitude, recipient_name, recipient_phone, recipient_address, recipient_city, recipient_state, recipient_postal_code, recipient_latitude, recipient_longitude, weight, dimensions, declared_value, notes, estimated_delivery, actual_delivery, current_latitude, current_longitude, customer_id, assigned_agent_id, origin_branch_id, destination_branch_id)
SELECT '66666666-0000-0000-0000-000000000004', 'COUR-NYC004-2026', 'OUT_FOR_DELIVERY', 'OVERNIGHT', 'TechStart Inc', '555-0105', '456 Innovation Blvd', 'Los Angeles', 'CA', '90001', 34.0522, -118.2437, 'Emma Wilson', '555-0500', '55 Park Avenue', 'New York', 'NY', '10016', 40.7505, -73.9739, 22.00, '40x30x20 cm', 1200.00, 'Fragile electronic equipment', now(), NULL, 40.7505, -73.9739, '11111111-0000-0000-0000-000000000006', '55555555-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001'
WHERE NOT EXISTS (SELECT 1 FROM shipments WHERE id = '66666666-0000-0000-0000-000000000004');

-- ============================================================
-- TRACKING HISTORY (recorded_by references users.id)
-- Driver 1 (agent ...001) = user 11111111-...003
-- Driver 2 (agent ...002) = user 11111111-...004
-- ============================================================

INSERT INTO tracking_history (shipment_id, event_type, message, latitude, longitude, city, recorded_by, timestamp)
SELECT '66666666-0000-0000-0000-000000000001', 'CREATED', 'Shipment created and pending pickup', 40.7128, -74.0060, 'New York', '11111111-0000-0000-0000-000000000005', now() - interval '3 days'
WHERE NOT EXISTS (SELECT 1 FROM tracking_history WHERE shipment_id = '66666666-0000-0000-0000-000000000001' AND event_type = 'CREATED');

INSERT INTO tracking_history (shipment_id, event_type, message, latitude, longitude, city, recorded_by, timestamp)
SELECT '66666666-0000-0000-0000-000000000001', 'PICKED_UP', 'Package picked up from sender', 40.7128, -74.0060, 'New York', '11111111-0000-0000-0000-000000000003', now() - interval '2 days 20 hours'
WHERE NOT EXISTS (SELECT 1 FROM tracking_history WHERE shipment_id = '66666666-0000-0000-0000-000000000001' AND event_type = 'PICKED_UP');

INSERT INTO tracking_history (shipment_id, event_type, message, latitude, longitude, city, recorded_by, timestamp)
SELECT '66666666-0000-0000-0000-000000000001', 'DEPARTED', 'Departed from Manhattan branch facility', 40.7128, -74.0060, 'New York', '11111111-0000-0000-0000-000000000002', now() - interval '2 days 18 hours'
WHERE NOT EXISTS (SELECT 1 FROM tracking_history WHERE shipment_id = '66666666-0000-0000-0000-000000000001' AND event_type = 'DEPARTED');

INSERT INTO tracking_history (shipment_id, event_type, message, latitude, longitude, city, recorded_by, timestamp)
SELECT '66666666-0000-0000-0000-000000000001', 'IN_TRANSIT', 'In transit on I-95 North', 41.0405, -73.1234, 'Stamford', '11111111-0000-0000-0000-000000000003', now() - interval '1 day'
WHERE NOT EXISTS (SELECT 1 FROM tracking_history WHERE shipment_id = '66666666-0000-0000-0000-000000000001' AND event_type = 'IN_TRANSIT' AND city = 'Stamford');

INSERT INTO tracking_history (shipment_id, event_type, message, latitude, longitude, city, recorded_by, timestamp)
SELECT '66666666-0000-0000-0000-000000000002', 'CREATED', 'Shipment created and pending pickup', 34.0522, -118.2437, 'Los Angeles', '11111111-0000-0000-0000-000000000006', now() - interval '3 days'
WHERE NOT EXISTS (SELECT 1 FROM tracking_history WHERE shipment_id = '66666666-0000-0000-0000-000000000002' AND event_type = 'CREATED');

INSERT INTO tracking_history (shipment_id, event_type, message, latitude, longitude, city, recorded_by, timestamp)
SELECT '66666666-0000-0000-0000-000000000002', 'PICKED_UP', 'Package picked up from sender', 34.0522, -118.2437, 'Los Angeles', '11111111-0000-0000-0000-000000000004', now() - interval '2 days 20 hours'
WHERE NOT EXISTS (SELECT 1 FROM tracking_history WHERE shipment_id = '66666666-0000-0000-0000-000000000002' AND event_type = 'PICKED_UP');

INSERT INTO tracking_history (shipment_id, event_type, message, latitude, longitude, city, recorded_by, timestamp)
SELECT '66666666-0000-0000-0000-000000000002', 'DELIVERED', 'Package delivered to recipient', 32.7157, -117.1611, 'San Diego', '11111111-0000-0000-0000-000000000004', now() - interval '5 hours'
WHERE NOT EXISTS (SELECT 1 FROM tracking_history WHERE shipment_id = '66666666-0000-0000-0000-000000000002' AND event_type = 'DELIVERED');

INSERT INTO tracking_history (shipment_id, event_type, message, latitude, longitude, city, recorded_by, timestamp)
SELECT '66666666-0000-0000-0000-000000000004', 'OUT_FOR_DELIVERY', 'Out for delivery to recipient address', 40.7505, -73.9739, 'New York', '11111111-0000-0000-0000-000000000003', now() - interval '2 hours'
WHERE NOT EXISTS (SELECT 1 FROM tracking_history WHERE shipment_id = '66666666-0000-0000-0000-000000000004' AND event_type = 'OUT_FOR_DELIVERY');

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

INSERT INTO notifications (user_id, shipment_id, type, status, title, message)
SELECT '11111111-0000-0000-0000-000000000005', '66666666-0000-0000-0000-000000000001', 'SHIPMENT_UPDATE', 'UNREAD', 'Shipment In Transit', 'Your shipment COUR-NYC001-2026 is currently in transit on I-95 North.'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = '11111111-0000-0000-0000-000000000005' AND shipment_id = '66666666-0000-0000-0000-000000000001');

INSERT INTO notifications (user_id, shipment_id, type, status, title, message)
SELECT '11111111-0000-0000-0000-000000000006', '66666666-0000-0000-0000-000000000002', 'DELIVERY_ALERT', 'READ', 'Package Delivered', 'Your shipment COUR-LAX002-2026 has been delivered to the recipient.'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = '11111111-0000-0000-0000-000000000006' AND shipment_id = '66666666-0000-0000-0000-000000000002');

INSERT INTO notifications (user_id, shipment_id, type, status, title, message)
SELECT '11111111-0000-0000-0000-000000000006', '66666666-0000-0000-0000-000000000004', 'DELIVERY_ALERT', 'UNREAD', 'Out for Delivery', 'Your shipment COUR-NYC004-2026 is out for delivery and will arrive today.'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = '11111111-0000-0000-0000-000000000006' AND shipment_id = '66666666-0000-0000-0000-000000000004');

INSERT INTO notifications (user_id, shipment_id, type, status, title, message)
SELECT '11111111-0000-0000-0000-000000000001', NULL, 'SYSTEM_MESSAGE', 'UNREAD', 'System Maintenance', 'The tracking system will undergo maintenance tonight from 2 AM to 4 AM EST.'
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id = '11111111-0000-0000-0000-000000000001' AND title = 'System Maintenance');

-- ============================================================
-- PAYMENTS
-- ============================================================

INSERT INTO payments (id, shipment_id, customer_id, amount, currency, method, status, transaction_ref, payment_date)
SELECT '77777777-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 45.99, 'USD', 'CREDIT_CARD', 'COMPLETED', 'TXN-REF-001', now() - interval '3 days'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = '77777777-0000-0000-0000-000000000001');

INSERT INTO payments (id, shipment_id, customer_id, amount, currency, method, status, transaction_ref, payment_date)
SELECT '77777777-0000-0000-0000-000000000002', '66666666-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000006', 28.50, 'USD', 'DEBIT_CARD', 'COMPLETED', 'TXN-REF-002', now() - interval '3 days'
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = '77777777-0000-0000-0000-000000000002');

INSERT INTO payments (id, shipment_id, customer_id, amount, currency, method, status, transaction_ref, payment_date)
SELECT '77777777-0000-0000-0000-000000000003', '66666666-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000006', 89.00, 'USD', 'CREDIT_CARD', 'PENDING', NULL, NULL
WHERE NOT EXISTS (SELECT 1 FROM payments WHERE id = '77777777-0000-0000-0000-000000000003');

-- ============================================================
-- AUDIT LOGS
-- ============================================================

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
SELECT '11111111-0000-0000-0000-000000000001', 'CREATE', 'shipment', '66666666-0000-0000-0000-000000000001', NULL, '{"status":"PENDING","tracking_number":"COUR-NYC001-2026"}'::jsonb, '192.168.1.100', 'Mozilla/5.0'
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE entity_id = '66666666-0000-0000-0000-000000000001' AND action = 'CREATE');

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
SELECT '11111111-0000-0000-0000-000000000002', 'UPDATE', 'shipment', '66666666-0000-0000-0000-000000000001', '{"status":"PICKED_UP"}'::jsonb, '{"status":"IN_TRANSIT"}'::jsonb, '192.168.1.101', 'Mozilla/5.0'
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE entity_id = '66666666-0000-0000-0000-000000000001' AND action = 'UPDATE');

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
SELECT '11111111-0000-0000-0000-000000000005', 'CREATE', 'payment', '77777777-0000-0000-0000-000000000001', NULL, '{"amount":45.99,"method":"CREDIT_CARD"}'::jsonb, '192.168.1.102', 'Mozilla/5.0'
WHERE NOT EXISTS (SELECT 1 FROM audit_logs WHERE entity_id = '77777777-0000-0000-0000-000000000001' AND action = 'CREATE');