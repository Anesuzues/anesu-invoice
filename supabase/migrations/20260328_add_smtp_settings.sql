-- Add per-company SMTP (Gmail) credentials for multi-user email support
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS smtp_gmail_user TEXT,
  ADD COLUMN IF NOT EXISTS smtp_gmail_password TEXT;
