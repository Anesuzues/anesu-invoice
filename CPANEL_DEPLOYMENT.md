# cPanel Hosting Deployment Guide

## 📦 Files Ready for Upload

The `dist/` folder contains all files needed for cPanel hosting:
- `index.html` - Main application file
- `assets/` - CSS, JavaScript, and other static files
- `.htaccess` - Apache configuration for routing and optimization

## 🚀 Deployment Steps

### 1. **Access cPanel File Manager**
- Login to your cPanel account
- Open "File Manager"
- Navigate to `public_html` (or your domain's document root)

### 2. **Upload Files**
- **Option A**: Upload the entire `dist/` folder contents
- **Option B**: Create a ZIP file and extract it

#### Option A - Direct Upload:
1. Select all files from the `dist/` folder
2. Drag and drop into `public_html`
3. Ensure `.htaccess` is uploaded (enable "Show Hidden Files" if needed)

#### Option B - ZIP Upload:
1. Create a ZIP file of the `dist/` folder contents
2. Upload the ZIP to `public_html`
3. Extract the ZIP file in cPanel File Manager
4. Delete the ZIP file after extraction

### 3. **Set File Permissions**
- `index.html`: 644
- `.htaccess`: 644
- `assets/` folder: 755
- All files in `assets/`: 644

### 4. **Verify Deployment**
- Visit your domain: `https://yourdomain.com`
- Test navigation (should work without page refreshes)
- Check that invoices display R300.00 (ZAR currency)

## ⚙️ Environment Variables

Your app uses these Supabase environment variables (already built into the files):
- `VITE_SUPABASE_URL`: https://mkueghplviscfqclwjpz.supabase.co
- `VITE_SUPABASE_ANON_KEY`: (embedded in build)

## 🔧 cPanel Requirements

### Minimum Requirements:
- **PHP**: Not required (static React app)
- **Node.js**: Not required (pre-built)
- **Apache**: Required (for .htaccess)
- **SSL Certificate**: Recommended

### Recommended cPanel Features:
- **File Manager**: For uploading files
- **Subdomain**: If you want a subdomain like `invoices.yourdomain.com`
- **SSL/TLS**: For HTTPS (required for Supabase)

## 📁 File Structure After Upload

```
public_html/
├── index.html
├── .htaccess
└── assets/
    ├── index-C6zGf1Vd.css
    ├── index-BLCvWWF5.js
    ├── index.es-B2N2w4T1.js
    ├── html2canvas.esm-CBrSDip1.js
    └── purify.es-BwoZCkIS.js
```

## 🌐 Domain Configuration

### Main Domain:
- Upload to `public_html/`
- Access via: `https://yourdomain.com`

### Subdomain (Optional):
1. Create subdomain in cPanel: `invoices.yourdomain.com`
2. Upload files to the subdomain's folder
3. Access via: `https://invoices.yourdomain.com`

## ✅ Testing Checklist

After deployment, test these features:
- [ ] **Login/Register**: User authentication works
- [ ] **Dashboard**: Loads without errors
- [ ] **Create Invoice**: Form works properly
- [ ] **Currency Display**: Shows R300.00 (ZAR)
- [ ] **PDF Download**: Generates and downloads PDFs
- [ ] **Email Sending**: Sends invoices via email
- [ ] **Public Invoice Links**: Clients can view invoices
- [ ] **Mobile Responsive**: Works on mobile devices

## 🔍 Troubleshooting

### Common Issues:

**1. "Page Not Found" on refresh:**
- Check `.htaccess` file is uploaded
- Verify Apache mod_rewrite is enabled

**2. "Mixed Content" errors:**
- Ensure your domain has SSL certificate
- Use HTTPS, not HTTP

**3. Blank page:**
- Check browser console for JavaScript errors
- Verify all files in `assets/` folder uploaded correctly

**4. Supabase connection issues:**
- Confirm HTTPS is working
- Check that environment variables are built into the files

### Support:
- **Supabase**: Edge functions and database work from any hosting
- **React Router**: Handled by .htaccess file
- **Static Assets**: All optimized and ready for production

## 📊 Performance Tips

- **GZIP**: Enabled via .htaccess
- **Caching**: Static assets cached for 1 year
- **CDN**: Consider using Cloudflare for better performance
- **SSL**: Required for Supabase and better SEO

Your invoice management system is now ready for cPanel hosting! 🎉