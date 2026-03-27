-- Add SMTP columns to companies table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'smtp_gmail_user') THEN
        ALTER TABLE companies ADD COLUMN smtp_gmail_user TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'smtp_gmail_password') THEN
        ALTER TABLE companies ADD COLUMN smtp_gmail_password TEXT;
    END IF;
END $$;