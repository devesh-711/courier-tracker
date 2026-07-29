/*
# Remove FK constraint from users to auth.users

## Overview
The `users` table has a foreign key constraint (`fk_users_auth`) that requires
`users.id` to exist in `auth.users(id)`. Since the Express backend manages its
own JWT-based authentication (not Supabase Auth), new users created via the
backend API don't exist in `auth.users`. This constraint must be removed.

## Changes
- Drops the `fk_users_auth` foreign key constraint on the `users` table.
- The `users.id` column remains a UUID primary key with `gen_random_uuid()`
  default — it just no longer requires a matching row in `auth.users`.
*/

ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_auth;