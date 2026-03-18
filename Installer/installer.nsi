;--------------------------------
;Plugins
;https://nsis.sourceforge.io/ApplicationID_plug-in
;https://nsis.sourceforge.io/ShellExecAsUser_plug-in
;https://nsis.sourceforge.io/NsProcess_plugin
;https://nsis.sourceforge.io/Inetc_plug-in

!addplugindir "Plugins\x86-unicode"

;--------------------------------
;Version
    !include "version_define.nsh"

    !define PRODUCT_VERSION ${PRODUCT_VERSION_FROM_FILE}
    !define VERSION ${PRODUCT_VERSION_FROM_FILE}

    VIProductVersion "${PRODUCT_VERSION}"
    VIFileVersion "${VERSION}"
    VIAddVersionKey "FileVersion" "${VERSION}"
    VIAddVersionKey "ProductName" "VRCX"
    VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"
    VIAddVersionKey "LegalCopyright" "Copyright vrcx-team, pypy, natsumi"
    VIAddVersionKey "FileDescription" "Friendship management tool for VRChat"

;--------------------------------
;Include Modern UI

    !include "MUI2.nsh"
    !include "FileFunc.nsh"
    !include "LogicLib.nsh"
    !include "nsDialogs.nsh"

;--------------------------------
;General

    Unicode True
    Name "VRCX"
    OutFile "VRCX_Setup.exe"
    InstallDir "$LOCALAPPDATA\VRCX"
    RequestExecutionLevel user
    ShowInstDetails show

;--------------------------------
;Variables

    VAR upgradeInstallation
    VAR InstallMode        ; "appdata" or "programfiles"
    VAR RadioAppData
    VAR RadioProgramFiles

;--------------------------------
;Interface Settings

    !define MUI_ABORTWARNING

;--------------------------------
;Icons

    !define MUI_ICON "../images/VRCX.ico"
    !define MUI_UNICON "../images/VRCX.ico"

;--------------------------------
;Pages

    Page custom InstallLocationPage InstallLocationPageLeave

    !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfUpgrade
    !insertmacro MUI_PAGE_LICENSE "..\LICENSE"

    !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfUpgrade
    !insertmacro MUI_PAGE_DIRECTORY

    !insertmacro MUI_PAGE_INSTFILES

    ;------------------------------
    ; Finish Page

    ; Checkbox to launch VRCX.
    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_TEXT "Launch VRCX"
    !define MUI_FINISHPAGE_RUN_FUNCTION launchVRCX

    ; Checkbox to create desktop shortcut.
    !define MUI_FINISHPAGE_SHOWREADME
    !define MUI_FINISHPAGE_SHOWREADME_TEXT "Create desktop shortcut"
    !define MUI_FINISHPAGE_SHOWREADME_FUNCTION createDesktopShortcut

    !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfUpgrade
    !insertmacro MUI_PAGE_FINISH

    !insertmacro MUI_UNPAGE_CONFIRM
    !insertmacro MUI_UNPAGE_INSTFILES
    !insertmacro MUI_UNPAGE_FINISH

;--------------------------------
;Languages

    !insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Functions

Function SkipIfUpgrade
    StrCmp $upgradeInstallation 0 noUpgrade
        Abort
    noUpgrade:
FunctionEnd

; Custom page to choose install location (only shown for fresh installs)
Function InstallLocationPage
    ; Skip for upgrades (install dir already set from registry in .onInit)
    StrCmp $upgradeInstallation 1 skipPage

    !insertmacro MUI_HEADER_TEXT "Installation Location" "Choose where to install VRCX"

    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateLabel} 0 0 100% 24u "Select where you would like to install VRCX:"
    Pop $0

    ${NSD_CreateRadioButton} 16u 28u 100% 14u "Install to AppData (recommended, no administrator required)"
    Pop $RadioAppData

    ${NSD_CreateLabel} 32u 44u 100% 14u "Installs to: $LOCALAPPDATA\VRCX"
    Pop $0

    ${NSD_CreateRadioButton} 16u 62u 100% 14u "Install to Program Files (requires administrator)"
    Pop $RadioProgramFiles

    ${NSD_CreateLabel} 32u 78u 100% 14u "Installs to: $PROGRAMFILES64\VRCX"
    Pop $0

    ; Default selection based on current InstallMode
    ${If} $InstallMode == "programfiles"
        ${NSD_Check} $RadioProgramFiles
    ${Else}
        ${NSD_Check} $RadioAppData
    ${EndIf}

    nsDialogs::Show
    Return

    skipPage:
        Abort
FunctionEnd

Function InstallLocationPageLeave
    ${NSD_GetState} $RadioProgramFiles $0
    ${If} $0 = ${BST_CHECKED}
        StrCpy $InstallMode "programfiles"
        StrCpy $INSTDIR "$PROGRAMFILES64\VRCX"

        ; Check if we already have admin rights
        UserInfo::GetAccountType
        Pop $0
        ${If} $0 != "Admin"
            ; Re-launch with elevation, passing /PROGRAMFILES so the elevated
            ; instance knows the user's choice and skips the location page
            MessageBox MB_OKCANCEL|MB_ICONINFORMATION \
                "Installing to Program Files requires administrator privileges.$\n$\nClick OK to restart the installer with elevated permissions, or Cancel to go back." \
                /SD IDOK IDCANCEL goBack
            ClearErrors
            ExecShell "runas" "$EXEPATH" "/PROGRAMFILES"
            ${If} ${Errors}
                MessageBox MB_OK|MB_ICONEXCLAMATION \
                    "Could not obtain administrator privileges.$\nPlease try again or choose the AppData installation option."
            ${EndIf}
            Quit
            goBack:
                Abort
        ${EndIf}
    ${Else}
        StrCpy $InstallMode "appdata"
        StrCpy $INSTDIR "$LOCALAPPDATA\VRCX"
    ${EndIf}
FunctionEnd

Function .onInit
    StrCpy $upgradeInstallation 0
    StrCpy $InstallMode "appdata"
    StrCpy $INSTDIR "$LOCALAPPDATA\VRCX"

    ; Check if re-launched with /PROGRAMFILES flag (elevated re-launch by this installer)
    ClearErrors
    ${GetParameters} $R0
    ${GetOptions} $R0 /PROGRAMFILES $R1
    ${IfNot} ${Errors}
        StrCpy $InstallMode "programfiles"
        StrCpy $INSTDIR "$PROGRAMFILES64\VRCX"
    ${EndIf}
    ClearErrors

    ; Check for existing Program Files installation (HKLM)
    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "UninstallString"
    ${If} $R0 != ""
        StrCpy $upgradeInstallation 1
        ReadRegStr $R1 HKLM "Software\VRCX" "InstallDir"
        ${If} $R1 != ""
            StrCpy $INSTDIR $R1
        ${EndIf}
        StrCpy $InstallMode "programfiles"
    ${Else}
        ; Check for existing AppData installation (HKCU)
        ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "UninstallString"
        ${If} $R0 != ""
            StrCpy $upgradeInstallation 1
            ReadRegStr $R1 HKCU "Software\VRCX" "InstallDir"
            ${If} $R1 != ""
                StrCpy $INSTDIR $R1
            ${EndIf}
            StrCpy $InstallMode "appdata"
        ${EndIf}
    ${EndIf}

    ; For upgrades to Program Files, elevate immediately if not already admin
    ${If} $upgradeInstallation = 1
    ${AndIf} $InstallMode == "programfiles"
        UserInfo::GetAccountType
        Pop $0
        ${If} $0 != "Admin"
            ClearErrors
            ${GetParameters} $R0
            ExecShell "runas" "$EXEPATH" "/PROGRAMFILES $R0"
            ${If} ${Errors}
                MessageBox MB_OK|MB_ICONEXCLAMATION \
                    "Could not obtain administrator privileges required to update the Program Files installation."
                Abort
            ${EndIf}
            Quit
        ${EndIf}
    ${EndIf}

    ; If VRCX is already running, display a warning message
    loop:
    StrCpy $1 "VRCX.exe"
    nsProcess::_FindProcess "$1"
    Pop $R1
    ${If} $R1 = 0
        MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "VRCX is still running. $\n$\nClick `OK` to kill the running process or `Cancel` to cancel this installer." /SD IDOK IDCANCEL cancel
            nsExec::ExecToStack "taskkill /IM VRCX.exe"
    ${Else}
        Goto done
    ${EndIf}
    Sleep 1000
    Goto loop

    cancel:
        Abort
    done:
FunctionEnd

Function .onInstSuccess
    ${If} $upgradeInstallation = 1
        Call launchVRCX
    ${EndIf}
FunctionEnd

Function createDesktopShortcut
    CreateShortcut "$DESKTOP\VRCX.lnk" "$INSTDIR\VRCX.exe"
FunctionEnd

Function launchVRCX
    SetOutPath $INSTDIR
    ShellExecAsUser::ShellExecAsUser "" "$INSTDIR\VRCX.exe" ""
FunctionEnd

;--------------------------------
;Installer Sections

Section "Install" SecInstall
    StrCmp $upgradeInstallation 0 noUpgrade
        DetailPrint "Uninstall previous version..."
        ExecWait '"$INSTDIR\Uninstall.exe" /S _?=$INSTDIR'
        Delete $INSTDIR\Uninstall.exe
        Goto afterUpgrade
    noUpgrade:

    inetc::get "https://aka.ms/vs/17/release/vc_redist.x64.exe" $TEMP\vcredist_x64.exe
    ExecWait "$TEMP\vcredist_x64.exe /install /quiet /norestart"
    Delete "$TEMP\vcredist_x64.exe"

    afterUpgrade:

    SetOutPath "$INSTDIR"

    File /r /x *.log /x *.pdb "..\build\Cef\*.*"

    WriteUninstaller "$INSTDIR\Uninstall.exe"

    ; Write registry entries based on install mode
    ${If} $InstallMode == "programfiles"
        WriteRegStr HKLM "Software\VRCX" "InstallDir" $INSTDIR
        WriteRegStr HKLM "Software\VRCX" "InstallMode" "programfiles"
        WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "DisplayName" "VRCX"
        WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "Publisher" "vrcx-team"
        WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "DisplayVersion" "${VERSION}"
        WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "DisplayArch" "x64"
        WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "InstallLocation" "$INSTDIR"
        WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
        WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "DisplayIcon" "$\"$INSTDIR\VRCX.ico$\""
        ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
        IntFmt $0 "0x%08X" $0
        WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "EstimatedSize" "$0"
    ${Else}
        WriteRegStr HKCU "Software\VRCX" "InstallDir" $INSTDIR
        WriteRegStr HKCU "Software\VRCX" "InstallMode" "appdata"
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "DisplayName" "VRCX"
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "Publisher" "vrcx-team"
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "DisplayVersion" "${VERSION}"
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "DisplayArch" "x64"
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "InstallLocation" "$INSTDIR"
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "DisplayIcon" "$\"$INSTDIR\VRCX.ico$\""
        ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
        IntFmt $0 "0x%08X" $0
        WriteRegDWORD HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "EstimatedSize" "$0"
    ${EndIf}

    ${GetParameters} $R2
    ${GetOptions} $R2 /SKIP_SHORTCUT= $3
    StrCmp $3 "true" noShortcut
        CreateShortCut "$SMPROGRAMS\VRCX.lnk" "$INSTDIR\VRCX.exe"
        ApplicationID::Set "$SMPROGRAMS\VRCX.lnk" "VRCX"
    noShortcut:

    WriteRegStr HKCU "Software\Classes\vrcx" "" "URL:vrcx"
    WriteRegStr HKCU "Software\Classes\vrcx" "FriendlyTypeName" "VRCX"
    WriteRegStr HKCU "Software\Classes\vrcx" "URL Protocol" ""
    WriteRegExpandStr HKCU "Software\Classes\vrcx\DefaultIcon" "" "$INSTDIR\VRCX.ico"
    WriteRegStr HKCU "Software\Classes\vrcx\shell" "" "open"
    WriteRegStr HKCU "Software\Classes\vrcx\shell\open" "FriendlyAppName" "VRCX"
    WriteRegStr HKCU "Software\Classes\vrcx\shell\open\command" "" '"$INSTDIR\VRCX.exe" /uri="%1" /params="%2 %3 %4"'
SectionEnd

;--------------------------------
;Uninstaller Section

Function un.onInit
    ; Determine install mode from registry so we know if elevation is needed
    StrCpy $InstallMode "appdata"

    ReadRegStr $R0 HKLM "Software\VRCX" "InstallMode"
    ${If} $R0 == "programfiles"
        StrCpy $InstallMode "programfiles"
        ReadRegStr $R1 HKLM "Software\VRCX" "InstallDir"
        ${If} $R1 != ""
            StrCpy $INSTDIR $R1
        ${EndIf}
    ${Else}
        ReadRegStr $R1 HKCU "Software\VRCX" "InstallDir"
        ${If} $R1 != ""
            StrCpy $INSTDIR $R1
        ${EndIf}
    ${EndIf}

    ; Elevate if uninstalling from Program Files
    ${If} $InstallMode == "programfiles"
        UserInfo::GetAccountType
        Pop $0
        ${If} $0 != "Admin"
            ClearErrors
            ExecShell "runas" "$EXEPATH" ""
            ${If} ${Errors}
                MessageBox MB_OK|MB_ICONEXCLAMATION \
                    "Could not obtain administrator privileges required to uninstall from Program Files."
                Abort
            ${EndIf}
            Quit
        ${EndIf}
    ${EndIf}
FunctionEnd

Section "Uninstall"
    ; If VRCX is already running, display a warning message and exit
    StrCpy $1 "VRCX.exe"
    nsProcess::_FindProcess "$1"
    Pop $R1
    ${If} $R1 = 0
        MessageBox MB_OK|MB_ICONEXCLAMATION "VRCX is still running. Cannot uninstall this software.$\nPlease close VRCX and try again." /SD IDOK
        Abort
    ${EndIf}

    RMDir /r "$INSTDIR"

    ; Remove registry entries from both hives (handles migration scenarios)
    DeleteRegKey HKLM "Software\VRCX"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX"
    DeleteRegKey HKCU "Software\VRCX"
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX"
    DeleteRegKey HKCU "Software\Classes\vrcx"

    ${IfNot} ${Silent}
        Delete "$SMPROGRAMS\VRCX.lnk"
        Delete "$DESKTOP\VRCX.lnk"
    ${EndIf}
SectionEnd
