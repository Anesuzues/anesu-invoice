-- Manual SQL to update currency settings
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Add SMTP columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'smtp_gmail_user') THEN
        ALTER TABLE companies ADD COLUMN smtp_gmail_user TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'smtp_gmail_password') THEN
        ALTER TABLE companies ADD COLUMN smtp_gmail_password TEXT;
    END IF;
END $$;

-- 2. Update existing companies to use ZAR currency
UPDATE companies 
SET currency = 'ZAR' 
WHERE currency IS NULL OR currency = 'USD';

-- 3. Set default currency for new companies to ZAR
ALTER TABLE companies 
ALTER COLUMN currency SET DEFAULT 'ZAR';