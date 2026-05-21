-- Kaviro beta launch: columnas de referidos en profiles
-- Ejecutar en Supabase → SQL Editor antes de abrir la beta.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   text,
  ADD COLUMN IF NOT EXISTS referral_months_earned int DEFAULT 0;

UPDATE profiles
SET referral_code = lower(substr(md5(id::text), 1, 8))
WHERE referral_code IS NULL;
