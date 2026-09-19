Unicode True
!include "MUI2.nsh"
!include "LogicLib.nsh"
!addplugindir "Plugins\x86-unicode"
Name "VRCX Insights Preview"
OutFile "VRCX-Insights_Setup.exe"
InstallDir "$PROGRAMFILES64\VRCX-Insights"
RequestExecutionLevel admin
SetCompressor /SOLID lzma
!define MUI_ABORTWARNING
!define MUI_ICON "..\images\VRCX.ico"
!define MUI_UNICON "..\images\VRCX.ico"
!insertmacro MUI_PAGE_LICENSE "..\LICENSE"
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"
Section "Install"
    ; Fixed isolated destination, even when /D is passed.
    StrCpy $INSTDIR "$PROGRAMFILES64\VRCX-Insights"
    IfFileExists "$INSTDIR\VRCX.exe" 0 +3
        MessageBox MB_OK "The destination contains official VRCX. Installation aborted." /SD IDOK
        Abort
    nsProcess::_FindProcess "VRCX-Insights.exe"
    Pop $0
    ${If} $0 = 0
        MessageBox MB_OK "Close VRCX Insights before installing. Official VRCX need not be closed." /SD IDOK
        Abort
    ${EndIf}
    SetOutPath "$INSTDIR"
    File /r "..\build\InsightsPackage\*"
    ExecWait '"$INSTDIR\vc_redist.x64.exe" /install /quiet /norestart' $1
    ${If} $1 != 0
    ${AndIf} $1 != 3010
    ${AndIf} $1 != 1638
        MessageBox MB_OK "Visual C++ runtime setup returned $1. Check vc_redist.x64.exe before starting." /SD IDOK
    ${EndIf}
    FileOpen $0 "$INSTDIR\insights-install.marker" w
    FileWrite $0 "VRCX Insights isolated preview"
    FileClose $0
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    CreateShortcut "$SMPROGRAMS\VRCX Insights.lnk" "$INSTDIR\VRCX-Insights.exe"
    CreateShortcut "$DESKTOP\VRCX Insights.lnk" "$INSTDIR\VRCX-Insights.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX-Insights" "DisplayName" "VRCX Insights Preview"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX-Insights" "Publisher" "RICHARDwuxiaofei (unofficial fork)"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX-Insights" "UninstallString" '$\"$INSTDIR\Uninstall.exe$\"'
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX-Insights" "InstallLocation" "$INSTDIR"
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX-Insights" "NoModify" 1
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX-Insights" "NoRepair" 1
    ; No URI handler, automatic launch, group join or user-data import.
SectionEnd
Section "Uninstall"
    nsProcess::_FindProcess "VRCX-Insights.exe"
    Pop $0
    ${If} $0 = 0
        MessageBox MB_OK "Close VRCX Insights before uninstalling." /SD IDOK
        Abort
    ${EndIf}
    IfFileExists "$INSTDIR\insights-install.marker" 0 done
        Delete "$SMPROGRAMS\VRCX Insights.lnk"
        Delete "$DESKTOP\VRCX Insights.lnk"
        DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX-Insights"
        DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "VRCX-Insights"
        RMDir /r "$INSTDIR"
    done:
    ; Both official and Insights AppData are intentionally preserved.
SectionEnd
