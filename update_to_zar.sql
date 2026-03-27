-- Update currency to ZAR (South African Rand)
UPDATE companies 
SET currency = 'ZAR' 
WHERE currency IS NULL OR currency = 'USD' OR currency = '';

-- Add SMTP columns for multi-user email support
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'smtp_gmail_user') THEN
        ALTER TABLE companies ADD COLUMN smtp_gmail_user TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'smtp_gmail_password') THEN
        ALTER TABLE companies ADD COLUMN smtp_gmail_password TEXT;
    END IF;
END $$;

-- Verify the changes
SELECT name, currency, smtp_gmail_user FROM companies;