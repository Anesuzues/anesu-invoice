-- Add bank details to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_name text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_account_name text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_account_number text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_routing_number text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_swift_code text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_iban text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS payment_instructions text;