# hCaptcha Setup Guide

## Overview
The registration form now includes hCaptcha verification to prevent spam and bot registrations. This guide explains how to set up hCaptcha for your invoice management system.

## Current Implementation
- ✅ hCaptcha React component integrated
- ✅ Captcha token validation in registration flow
- ✅ Environment variable configuration
- ✅ Error handling for captcha failures

## Setup Steps

### 1. Create hCaptcha Account
1. Go to [hCaptcha.com](https://www.hcaptcha.com/)
2. Sign up for a free account
3. Create a new site in your hCaptcha dashboard
4. Get your **Site Key** and **Secret Key**

### 2. Configure Environment Variables

#### Local Development (.env)
```env
VITE_HCAPTCHA_SITE_KEY=your_actual_site_key_here
```

#### Production (Vercel)
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Add environment variable:
   - **Name**: `VITE_HCAPTCHA_SITE_KEY`
   - **Value**: Your actual hCaptcha site key

### 3. Configure Supabase Auth
1. Go to your Supabase dashboard
2. Navigate to Authentication > Settings
3. Enable "Enable Captcha protection"
4. Add your hCaptcha **Secret Key** in the Captcha settings

### 4. Test the Implementation
1. Try registering a new account
2. Complete the hCaptcha challenge
3. Verify successful registration

## Current Configuration

### Test Mode
The system currently uses hCaptcha's test site key: `10000000-ffff-ffff-ffff-000000000001`

This test key:
- ✅ Always passes validation
- ✅ Allows testing without real captcha challenges
- ⚠️ Should be replaced with your actual site key in production

### Production Setup Required
To enable real captcha protection:

1. **Replace the test site key** in `.env`:
   ```env
   VITE_HCAPTCHA_SITE_KEY=your_real_site_key
   ```

2. **Add the secret key** to Supabase Auth settings

3. **Update Vercel environment variables** with the real site key

## Features

### User Experience
- Captcha appears between password field and submit button
- Clean, centered layout
- Automatic token management
- Clear error messages for captcha failures

### Security Features
- Prevents automated bot registrations
- Validates captcha token server-side via Supabase
- Handles token expiration and errors gracefully
- Required captcha completion before form submission

### Error Handling
- Shows error if captcha not completed
- Handles captcha expiration
- Manages captcha verification failures
- Provides clear user feedback

## Troubleshooting

### Common Issues

**"Please complete the captcha verification"**
- User didn't complete the captcha challenge
- Captcha token expired
- Solution: Complete the captcha widget

**"Captcha verification process failed"**
- Invalid site key configuration
- Supabase secret key not configured
- Network connectivity issues
- Solution: Check environment variables and Supabase settings

**Captcha not loading**
- Invalid site key
- Network blocking hCaptcha domains
- Solution: Verify site key and network configuration

### Testing
Use the test site key `10000000-ffff-ffff-ffff-000000000001` for development and testing. This key always passes validation without showing actual captcha challenges.

## Next Steps
1. Create hCaptcha account and get real keys
2. Update environment variables with production keys
3. Configure Supabase Auth with secret key
4. Test registration flow in production
5. Monitor captcha analytics in hCaptcha dashboard