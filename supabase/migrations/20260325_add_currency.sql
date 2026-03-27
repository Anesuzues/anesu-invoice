-- Add currency column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ZAR';
