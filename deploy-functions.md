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
# Add your Gmail credentials (see README below for how to get App Password)
supabase secrets set GMAIL_USER=anesukamombe8@gmail.com
supabase secrets set GMAIL_APP_PASSWORD=your_16_char_app_password_here
```

### How to get a Gmail App Password
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** if not already on
3. Go to **App Passwords** (search for it at the top)
4. Select app: **Mail**, device: **Other** → type "InvoiceApp" → click **Generate**
5. Copy the 16-character password and use it above

## Test Email Function
```bash
# Test sending an email
curl -X POST 'https://mkueghplviscfqclwjpz.supabase.co/functions/v1/send-invoice-email' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"invoiceId": "test-invoice-id"}'
```