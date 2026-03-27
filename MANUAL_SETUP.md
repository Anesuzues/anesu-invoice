# Manual Setup Instructions

## 1. Add SMTP Columns to Database

Go to your Supabase dashboard → SQL Editor and run this SQL:

```sql
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
```

## 2. Verify Edge Functions Are Deployed

✅ Functions deployed successfully:
- `get-public-invoice` - for public invoice access
- `send-invoice-email` - updated for multi-user support

Check at: https://supabase.com/dashboard/project/mkueghplviscfqclwjpz/functions

## 3. Test Public Invoice Access

1. Open `test-public-invoice.html` in your browser
2. Enter any existing invoice ID
3. Click "Test Access"
4. Should show invoice details without "invoice not found" error

## 4. Test Multi-User Email Setup

### For You (existing user):
1. Go to Settings → Email Settings
2. Add your Gmail address and App Password
3. Save settings
4. Send an invoice - should use your credentials

### For New Users:
1. Register a new account
2. Create a company profile
3. Go to Settings → Email Settings
4. Add their Gmail credentials
5. Create and send invoices with their own email

## 5. Environment Variables Check

Make sure these are set in Supabase → Settings → Edge Functions → Environment Variables:

- `SUPABASE_SERVICE_ROLE_KEY` (required for get-public-invoice)
- `GMAIL_USER` (optional fallback)
- `GMAIL_APP_PASSWORD` (optional fallback)

## 6. How to Get Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Enable 2-Step Verification if not already enabled
3. Generate a new App Password for "Mail"
4. Use the 16-character password in settings

## Troubleshooting

### "Invoice not found" error:
- Check that `get-public-invoice` function is deployed
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables

### Email sending fails:
- Check Gmail credentials in Settings → Email Settings
- Verify App Password is correct (16 characters, no spaces)
- Check that 2-Step Verification is enabled on Gmail account

### Database errors:
- Run the SQL above to add SMTP columns
- Check that companies table exists and has proper permissions