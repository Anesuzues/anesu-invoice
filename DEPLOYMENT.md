# Deployment Guide - Anesu Invoice App

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account with the repository created
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Supabase project credentials

### Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `anesu-invoice`
3. Description: "Invoice Management System with Supabase"
4. Choose Public or Private
5. **DO NOT** initialize with README
6. Click "Create repository"

### Step 2: Push Code to GitHub

The code is ready to push. Run:
```bash
git push -u origin main
```

### Step 3: Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Vercel**: Visit [vercel.com](https://vercel.com)
2. **Sign in** with your GitHub account
3. **Click**: "Add New" → "Project"
4. **Import** your `anesu-invoice` repository
5. **Configure Project**:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

6. **Add Environment Variables** (IMPORTANT):
   Click "Environment Variables" and add:
   ```
   VITE_SUPABASE_URL=https://mkueghplviscfqclwjpz.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rdWVnaHBsdmlzY2ZxY2x3anB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTQ5NDMsImV4cCI6MjA4OTE5MDk0M30.EuSxziCtuVKD5x19sqYreiWrNjDvU4gCxqLaNrXkGm0
   ```

7. **Click**: "Deploy"

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts and add environment variables when asked
```

### Step 4: Configure Supabase

1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your Vercel deployment URL to:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

### Step 5: Set Up Database

If you haven't already:
1. Go to Supabase dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20260312212728_create_tables.sql`
3. Paste and execute

## 🎉 Your App Will Be Live!

After deployment, your app will be available at:
- **Production**: `https://anesu-invoice.vercel.app` (or your custom domain)
- **Preview**: Automatic preview deployments for each push

## 🔄 Automatic Deployments

Every time you push to GitHub:
- **main branch** → Production deployment
- **other branches** → Preview deployments

## 📊 Features Available After Deployment

- ✅ User authentication
- ✅ Invoice management
- ✅ Client management
- ✅ Product catalog
- ✅ Dashboard analytics
- ✅ Responsive design
- ✅ Secure Supabase integration

## 🔒 Security Notes

- Environment variables are encrypted in Vercel
- .env file is not committed to GitHub
- Supabase RLS policies protect your data
- HTTPS enabled by default

## 🆘 Troubleshooting

### Build Fails
- Check that all dependencies are in package.json
- Verify environment variables are set correctly

### Blank Page After Deploy
- Ensure environment variables are added in Vercel
- Check browser console for errors
- Verify Supabase URL is accessible

### Authentication Issues
- Add Vercel URL to Supabase redirect URLs
- Check that VITE_SUPABASE_ANON_KEY is correct

## 📝 Custom Domain (Optional)

1. Go to Vercel dashboard → Your project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update Supabase redirect URLs with new domain

## 🎯 Next Steps After Deployment

1. Test authentication flow
2. Create your first invoice
3. Invite team members
4. Set up custom domain (optional)
5. Configure email templates in Supabase
6. Enable analytics in Vercel

Your Invoice Management System is now live and ready to use! 🚀
