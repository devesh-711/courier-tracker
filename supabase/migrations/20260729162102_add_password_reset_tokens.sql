/*
# Password Reset Tokens Table

## Overview
Adds a dedicated table for storing password reset tokens with expiration,
enabling the forgot/reset password flow.

## New Table
- `password_reset_tokens`
  - `id` (uuid, primary key)
  - `user_id` (uuid, FK to users, CASCADE on delete)
  - `token` (text, unique, not null) — the reset token
  - `expires_at` (timestamptz, not null) — when the token expires
  - `used_at` (timestamptz, nullable) — when the token was consumed
  - `created_at` (timestamptz, default now())

## Security
- RLS enabled with owner-scoped policies (user can only see their own tokens).
- Index on `token` for fast lookups during reset.
- Index on `user_id` for cleanup queries.
*/

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE,
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);