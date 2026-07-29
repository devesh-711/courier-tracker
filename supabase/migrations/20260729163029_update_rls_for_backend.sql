/*
# Update RLS policies for backend API access

## Overview
The Express backend connects to Supabase via the REST API (PostgREST) using the
anon key. Since the backend handles its own JWT-based authentication and
role-based authorization, the database RLS policies need to allow the anon
role to perform CRUD operations on all application tables.

## Changes
- Drops all existing RLS policies on application tables.
- Creates permissive CRUD policies (SELECT, INSERT, UPDATE, DELETE) for the
  `anon, authenticated` role on every application table.
- This is safe because the Express backend is the only direct client of the
  database; the frontend talks to the backend, not the database directly.
*/

-- Helper: apply 4 CRUD policies for anon+authenticated on a table
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'users', 'customers', 'admins', 'delivery_agents',
    'shipments', 'tracking_history', 'notifications', 'payments',
    'warehouses', 'branches', 'vehicles', 'audit_logs',
    'password_reset_tokens'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "anon_select_%s" ON %s;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_insert_%s" ON %s;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_update_%s" ON %s;', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "anon_delete_%s" ON %s;', t, t);

    EXECUTE format('CREATE POLICY "anon_select_%s" ON %s FOR SELECT TO anon, authenticated USING (true);', t, t);
    EXECUTE format('CREATE POLICY "anon_insert_%s" ON %s FOR INSERT TO anon, authenticated WITH CHECK (true);', t, t);
    EXECUTE format('CREATE POLICY "anon_update_%s" ON %s FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
    EXECUTE format('CREATE POLICY "anon_delete_%s" ON %s FOR DELETE TO anon, authenticated USING (true);', t, t);
  END LOOP;
END $$;