# Deploy Edge Functions

## Install Supabase CLI (if not already installed)

```bash
# Using npm
npm install -g supabase

# Or using scoop on Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Deploy Functions

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref mkueghplviscfqclwjpz

# Deploy the new public invoice function
supabase functions deploy get-public-invoice

# Redeploy the updated send-invoice-email function
supabase functions deploy send-invoice-email

# Apply the database migration
supabase db push
```

## Verify Deployment

1. Go to your Supabase dashboard → Edge Functions
2. Confirm both functions are deployed:
   - `get-public-invoice` (new)
   - `send-invoice-email` (updated)

## Test the Fixes

### Test Public Invoice Access:
1. Create an invoice and send it via email
2. Click "View Online" link in the email
3. Should now load without "invoice not found" error

### Test Multi-User Email:
1. Go to Settings → Email Settings
2. Add your Gmail address and App Password
3. Save settings
4. Send an invoice - should use your credentials instead of env secrets

## Environment Variables Required

Make sure these are set in Supabase secrets:
- `SUPABASE_SERVICE_ROLE_KEY` (for get-public-invoice function)
- `GMAIL_USER` (fallback email - optional)
- `GMAIL_APP_PASSWORD` (fallback password - optional)

The fallback credentials are only used if a company hasn't set their own email settings.