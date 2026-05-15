-- Adds SAFE and Convertible Note to the instrument_type enum.
-- Service-for-Equity is a flag inside Ordinary's instrument_data JSONB,
-- no schema change needed for that.

ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'safe';
ALTER TYPE instrument_type ADD VALUE IF NOT EXISTS 'convertible_note';
