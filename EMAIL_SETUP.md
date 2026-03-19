# 🔐 SECURE SETUP GUIDE

## Email Configuration

Your Resend API key is securely stored in Supabase secrets and not exposed in the repository.

### Setup Instructions

1. **Add your Resend API key to Supabase secrets:**
```bash
# Use your actual Resend API key
npx supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

2. **Deploy the functions:**
```bash
npx supabase functions deploy send-invoice-email
npx supabase functions deploy send-payment-reminders  
npx supabase functions deploy process-recurring-invoices
npx supabase functions deploy test-email
```

3. **Test email functionality:**
```bash
# Test the email system
Invoke-RestMethod -Uri "https://mkueghplviscfqclwjpz.supabase.co/functions/v1/test-email" -Method POST -Headers @{"Authorization"="Bearer YOUR_SUPABASE_ANON_KEY"; "Content-Type"="application/json"}
```

## Security Features

✅ **API keys stored securely** in Supabase Edge Function environment
✅ **No secrets in repository** - all sensitive data excluded
✅ **Environment templates** provided for easy setup
✅ **Professional email templates** with company branding

## Email Functions Available

- `send-invoice-email` - Send invoices to clients
- `send-payment-reminders` - Automated payment follow-ups  
- `process-recurring-invoices` - Monthly recurring billing
- `test-email` - Email system verification