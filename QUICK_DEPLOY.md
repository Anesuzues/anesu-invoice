# 🚀 Quick Deploy Guide

## Step 1: Create GitHub Repository
1. Go to: https://github.com/new
2. Name: `anesu-invoice`
3. Public repository
4. Don't initialize with anything
5. Click "Create repository"

## Step 2: Push Code
```bash
git push -u origin main
```

## Step 3: Deploy to Vercel
1. Go to: https://vercel.com/new
2. Import `anesu-invoice` repository
3. Framework: Vite
4. Add Environment Variables:
   - `VITE_SUPABASE_URL` = `https://mkueghplviscfqclwjpz.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdWVnaHBsdmlzY2ZxY2x3anB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTQ5NDMsImV4cCI6MjA4OTE5MDk0M30.EuSxziCtuVKD5x19sqYreiWrNjDvU4gCxqLaNrXkGm0`
5. Click "Deploy"

## Step 4: Update Supabase
1. Go to Supabase dashboard
2. Authentication → URL Configuration
3. Add your Vercel URL to redirect URLs

## Done! 🎉
Your app will be live at: `https://anesu-invoice.vercel.app`
