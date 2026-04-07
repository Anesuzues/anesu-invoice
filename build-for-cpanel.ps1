# Build Anesu Invoice for cPanel hosting
Write-Host "Building Anesu Invoice for cPanel hosting..." -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Building production files..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "Step 2: Verifying .htaccess file..." -ForegroundColor Yellow
if (Test-Path "dist\.htaccess") {
    Write-Host "✅ .htaccess file exists" -ForegroundColor Green
} else {
    Write-Host "❌ .htaccess file missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 3: Creating ZIP file for upload..." -ForegroundColor Yellow
Compress-Archive -Path "dist\*" -DestinationPath "anesu-invoice-cpanel.zip" -Force
Write-Host "✅ ZIP file created: anesu-invoice-cpanel.zip" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 cPanel deployment ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "- dist/ folder (upload contents to public_html)"
Write-Host "- anesu-invoice-cpanel.zip (upload and extract in cPanel)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Login to your cPanel File Manager"
Write-Host "2. Upload anesu-invoice-cpanel.zip to public_html"
Write-Host "3. Extract the ZIP file"
Write-Host "4. Visit your domain to test"
Write-Host ""
Write-Host "For detailed instructions, see: CPANEL_DEPLOYMENT.md" -ForegroundColor Yellow