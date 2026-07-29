/*
# Create backend database user

Creates a dedicated database user for the Express backend with a known password,
so Prisma can connect directly to PostgreSQL.
*/

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'courier_app') THEN
    CREATE ROLE courier_app LOGIN PASSWORD 'courier-app-secure-2026';
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO courier_app;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO courier_app;
    GRANT USAGE ON SCHEMA public TO courier_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO courier_app;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO courier_app;
  END IF;
END $$;