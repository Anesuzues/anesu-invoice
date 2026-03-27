# Currency Update to ZAR (South African Rand)

## ✅ Changes Made

### **Frontend Updates:**
- **Currency Utility**: Changed default from USD to ZAR with `en-ZA` locale
- **All Pages**: Updated default currency from USD to ZAR in:
  - Dashboard.tsx
  - InvoiceView.tsx  
  - InvoiceForm.tsx
  - Invoices.tsx
  - Products.tsx
  - Settings.tsx
  - PublicInvoiceView.tsx
- **PDF Generator**: Updated to use ZAR formatting
- **Settings Page**: ZAR now appears first in currency placeholder

### **Database Updates:**
- **Migration**: Default currency for new companies set to ZAR
- **Update Script**: Existing companies changed from USD to ZAR

## 🎯 Result

**Before**: $300.00 (USD formatting)
**After**: R300.00 (ZAR formatting)

## 📋 Manual Steps Required

### 1. Run Database Update (Required)
Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Add SMTP columns and update currency
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'smtp_gmail_user') THEN
        ALTER TABLE companies ADD COLUMN smtp_gmail_user TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'smtp_gmail_password') THEN
        ALTER TABLE companies ADD COLUMN smtp_gmail_password TEXT;
    END IF;
END $$;

UPDATE companies 
SET currency = 'ZAR' 
WHERE currency IS NULL OR currency = 'USD';

ALTER TABLE companies 
ALTER COLUMN currency SET DEFAULT 'ZAR';
```

### 2. Test Currency Display
1. **Local**: http://localhost:5173/ (dev server running)
2. **Production**: https://anesu-invoice.vercel.app (auto-deploys from GitHub)
3. Create/view invoices → should show R300.00 instead of $300.00

### 3. Verify Multi-Currency Support
- Users can still change currency in Settings if needed
- System supports any 3-letter currency code (EUR, GBP, etc.)
- ZAR is just the new default for South African users

## 🌍 Localization Features

- **South African Locale**: Uses `en-ZA` for proper formatting
- **Currency Symbol**: R (Rand symbol) instead of $
- **Number Formatting**: Follows South African conventions
- **Flexible**: Still supports international currencies when needed

## 🚀 Deployment Status

- ✅ Code changes committed and pushed to GitHub
- ✅ Vercel will auto-deploy the frontend changes
- ⏳ Database update needs to be run manually (see step 1 above)
- ✅ Dev server running with hot reload at http://localhost:5173/

Your invoice system now properly displays South African Rand (ZAR) by default! 🇿🇦