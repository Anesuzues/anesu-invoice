-- Run this in Supabase Dashboard → SQL Editor to fix currency immediately

-- 1. Add SMTP columns (needed for multi-user email)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'smtp_gmail_user') THEN
        ALTER TABLE companies ADD COLUMN smtp_gmail_user TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'smtp_gmail_password') THEN
        ALTER TABLE companies ADD COLUMN smtp_gmail_password TEXT;
    END IF;
END $$;

-- 2. Update ALL existing companies to use ZAR
UPDATE companies 
SET currency = 'ZAR' 
WHERE currency IS NULL OR currency = 'USD' OR currency = '';

-- 3. Set default for new companies
ALTER TABLE companies 
ALTER COLUMN currency SET DEFAULT 'ZAR';

-- 4. Verify the update
SELECT id, name, currency FROM companies;