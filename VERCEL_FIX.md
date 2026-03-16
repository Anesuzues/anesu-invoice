# 🔧 Fix Vercel Deployment - Blank Page Issue

## Problem
Your Vercel deployment at https://anesu-invoice.vercel.app is showing a blank page because the environment variables are not configured.

## Solution: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on your `anesu-invoice` project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar

### Step 2: Add Environment Variables

Add these TWO variables:

#### Variable 1:
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://mkueghplviscfqclwjpz.supabase.co`
- **Environment**: Check all (Production, Preview, Development)
- Click **Save**

#### Variable 2:
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: 
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdWVnaHBsdmlzY2ZxY2x3anB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTQ5NDMsImV4cCI6MjA4OTE5MDk0M30.EuSxziCtuVKD5x19sqYreiWrNjDvU4gCxqLaNrXkGm0
```
- **Environment**: Check all (Production, Preview, Development)
- Click **Save**

### Step 3: Redeploy

After adding the environment variables:

1. Go to the **Deployments** tab
2. Click on the three dots (...) next to the latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes for the new deployment

OR

1. Go to your project overview
2. Click **Redeploy** button at the top

### Step 4: Verify

Once redeployed:
1. Visit: https://anesu-invoice.vercel.app
2. You should see the Login page
3. Try creating an account

## Alternative: Redeploy via Git Push

If the above doesn't work, make a small change and push:

```bash
# Make a small change
echo "# Vercel deployment fix" >> README.md

# Commit and push
git add README.md
git commit -m "Trigger Vercel redeploy with env vars"
git push origin main
```

This will trigger a new deployment that will pick up the environment variables.

## Troubleshooting

### Still Blank After Redeploy?

1. **Check Browser Console**:
   - Press F12 in your browser
   - Look for errors in the Console tab
   - Common error: "Missing Supabase environment variables"

2. **Verify Environment Variables**:
   - Go to Vercel Settings → Environment Variables
   - Make sure both variables are there
   - Make sure there are no extra spaces or line breaks

3. **Check Build Logs**:
   - Go to Deployments tab
   - Click on the latest deployment
   - Check the build logs for errors

4. **Clear Browser Cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in incognito/private mode

### Common Mistakes

❌ **Wrong**: Variable name without `VITE_` prefix
✅ **Correct**: `VITE_SUPABASE_URL`

❌ **Wrong**: Forgetting to redeploy after adding variables
✅ **Correct**: Always redeploy after changing environment variables

❌ **Wrong**: Adding variables only to Production
✅ **Correct**: Add to all environments (Production, Preview, Development)

## Expected Result

After fixing, you should see:
- ✅ Login page with email/password fields
- ✅ "Sign up" link
- ✅ No console errors
- ✅ Ability to create an account

## Need More Help?

If you're still having issues:
1. Check Vercel deployment logs
2. Verify Supabase project is active
3. Make sure the Supabase URL in redirect URLs includes your Vercel domain
4. Try deploying from a fresh git push

Your app will be live once the environment variables are configured! 🚀
