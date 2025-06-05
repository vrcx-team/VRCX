:: Retrieve the version string from the 'Version' file located in the parent directory.
set /p NSIS_FILE_VERSION=<..\Version

:: Append ".0" to the version. This converts 'X.X.X' to 'X.X.X.0',
:: satisfying NSIS's strict four-part version format (e.g., for VIProductVersion).
:: Winget will treat 'X.X.X.0' as equal to 'X.X.X', so it won't trigger an unnecessary update.
set NSIS_FILE_VERSION_FOUR_PART=%NSIS_FILE_VERSION%.0

:: Compile the NSIS installer.
:: The formatted version is passed as a preprocessor define (PRODUCT_VERSION_FROM_FILE)
:: so it can be used within 'installer.nsi'.
"C:\Program Files (x86)\NSIS\makensis.exe" /DPRODUCT_VERSION_FROM_FILE="%NSIS_FILE_VERSION_FOUR_PART%" installer.nsi

pause