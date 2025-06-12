setlocal

:: Retrieve the version string from the 'Version' file located in the parent directory.
:: Load version from file into environment variable
for /f "usebackq delims=" %%v in ("..\Version") do set "VERSION=%%v"
set "VERSION=%VERSION%.0"

:: Append ".0" to the version. This converts 'X.X.X' to 'X.X.X.0',
:: satisfying NSIS's strict four-part version format (e.g., for VIProductVersion).
:: Winget will treat 'X.X.X.0' as equal to 'X.X.X', so it won't trigger an unnecessary update.
echo !define PRODUCT_VERSION_FROM_FILE "%VERSION%" > version_define.nsh

:: Compile the NSIS installer.
"C:\Program Files (x86)\NSIS\makensis.exe" installer.nsi

pause