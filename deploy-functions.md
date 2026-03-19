# Deploy Supabase Functions

## Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref mkueghplviscfqclwjpz
```

## Deploy Functions
```bash
# Deploy all functions
supabase functions deploy send-invoice-email
supabase functions deploy send-payment-reminders  
supabase functions deploy process-recurring-invoices
```

## Set Environment Variables
```bash
# Add your Resend API key (replace with your actual key)
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
```

## Test Email Function
```bash
# Test sending an email
curl -X POST 'https://mkueghplviscfqclwjpz.supabase.co/functions/v1/send-invoice-email' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"invoiceId": "test-invoice-id"}'
```