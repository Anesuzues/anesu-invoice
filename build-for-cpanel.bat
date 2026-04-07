@echo off
echo Building Anesu Invoice for cPanel hosting...
echo.

echo Step 1: Building production files...
call npm run build

echo.
echo Step 2: Adding .htaccess for Apache routing...
copy /Y dist\.htaccess dist\.htaccess >nul

echo.
echo Step 3: Creating ZIP file for upload...
powershell -Command "Compress-Archive -Path 'dist\*' -DestinationPath 'anesu-invoice-cpanel.zip' -Force"

echo.
echo ✅ cPanel deployment ready!
echo.
echo Files created:
echo - dist/ folder (upload contents to public_html)
echo - anesu-invoice-cpanel.zip (upload and extract in cPanel)
echo.
echo Next steps:
echo 1. Login to your cPanel File Manager
echo 2. Upload anesu-invoice-cpanel.zip to public_html
echo 3. Extract the ZIP file
echo 4. Visit your domain to test
echo.
pause