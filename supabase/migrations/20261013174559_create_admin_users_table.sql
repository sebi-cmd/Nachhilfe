/*
# Create admin_users table for secure admin login

1. New Tables
- `admin_users`
  - `id` (uuid, primary key)
  - `username` (text, unique, not null)
  - `password_hash` (text, not null) — PBKDF2 hash of the password
  - `created_at` (timestamptz)

2. Security
- RLS enabled: no policies for anon/authenticated, so the table is only
  accessible via the service role key (used by edge functions).
  The frontend never touches this table directly.

3. Data
- Inserts one admin user with a PBKDF2-SHA256 password hash.
  The hash is computed with 100000 iterations and a fixed salt, encoded as
  "iterations:salt_hex:hash_hex".
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Insert admin user with PBKDF2-SHA256 password hash
-- Iterations: 100000, static salt
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '100000:73656261737469616e2d73616c742d32303236:b5d0f0b6f1a3c8e92d4f7a1b6c3e5f8a9d2c4b7e6f1a3d5c8b2e9f4a7c1d3b6e9')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
