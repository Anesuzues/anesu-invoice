-- Add branch code and account type to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_branch_code text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_account_type text;
