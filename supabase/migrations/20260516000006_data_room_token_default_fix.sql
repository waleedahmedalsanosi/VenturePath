-- Fix latent bug discovered while testing Connections Hub accept flow.
-- The data_room_links.token DEFAULT clause uses encode(bytea, 'base64url'),
-- which is a Postgres 18+ feature. On Postgres 17 (current Supabase version),
-- 'base64url' is not a recognized encoding and the INSERT fails with
-- ERROR 22023: unrecognized encoding.
--
-- The original data_room_links table was added in 20260515190000_crm_and_data_room.sql
-- but the default was never exercised (zero rows existed) until Connections Hub
-- started creating data_room_link rows on inquiry accept.
--
-- Replace with a PG17-compatible URL-safe base64: standard base64 with
-- '/' → '_', '+' → '-', and trailing '=' padding stripped. Same token shape,
-- same uniqueness guarantee.

ALTER TABLE data_room_links
  ALTER COLUMN token SET DEFAULT regexp_replace(
    replace(replace(encode(gen_random_bytes(18), 'base64'), '/', '_'), '+', '-'),
    '=+$', ''
  );
