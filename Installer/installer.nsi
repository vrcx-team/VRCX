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

    SetCompressor /SOLID lzma
    SetCompressorDictSize 16
    Unicode True
    Name "VRCX"
    OutFile "VRCX_Setup.exe"
    InstallDir "$LOCALAPPDATA\VRCX"
    RequestExecutionLevel user
    ShowInstDetails show

;--------------------------------
;Variables

    VAR upgradeInstallation
    VAR InstallMode         ; "appdata" or "programfiles"  — the NEW install location
    VAR OldInstDir          ; previous install dir  (only used for "change" action)
    VAR OldInstMode         ; previous install mode (only used for "change" action)
    VAR MaintenanceAction   ; "" = fresh install | "update" | "change" | "uninstall"
    VAR ElevatedRelaunch    ; 1 if we were re-launched elevated via /PROGRAMFILES

    VAR RadioAppData
    VAR RadioProgramFiles
    VAR RadioUpdate
    VAR RadioChange
    VAR RadioUninstall

    VAR DeleteUserData      ; 1 = user wants to delete %APPDATA%\VRCX
    VAR CheckboxDeleteData

;--------------------------------
;Interface Settings

    !define MUI_ABORTWARNING

;--------------------------------
;Icons

    !define MUI_ICON "../images/VRCX.ico"
    !define MUI_UNICON "../images/VRCX.ico"

;--------------------------------
;Pages

    ; Maintenance page — shown only when VRCX is already installed
    Page custom MaintenancePage MaintenancePageLeave

    ; Location page — shown for fresh installs and "change location" action
    Page custom InstallLocationPage InstallLocationPageLeave

    ; License + directory — fresh installs only
    !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfNotFreshInstall
    !insertmacro MUI_PAGE_LICENSE "..\LICENSE"

    !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfNotFreshInstall
    !insertmacro MUI_PAGE_DIRECTORY

    !define MUI_PAGE_CUSTOMFUNCTION_PRE CheckVRCXNotRunning
    !insertmacro MUI_PAGE_INSTFILES

    ;------------------------------
    ; Finish Page — shown for fresh installs and "change location"; skipped for "update"

    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_TEXT "Launch VRCX"
    !define MUI_FINISHPAGE_RUN_FUNCTION launchVRCX

    !define MUI_FINISHPAGE_SHOWREADME
    !define MUI_FINISHPAGE_SHOWREADME_TEXT "Create desktop shortcut"
    !define MUI_FINISHPAGE_SHOWREADME_FUNCTION createDesktopShortcut

    !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfUpdate
    !insertmacro MUI_PAGE_FINISH

    !insertmacro MUI_UNPAGE_CONFIRM
    UninstPage custom un.DataDeletionPage un.DataDeletionPageLeave
    !insertmacro MUI_UNPAGE_INSTFILES
    !insertmacro MUI_UNPAGE_FINISH

;--------------------------------
;Languages

    !insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Page skip helpers

; Skip if this is a fresh install (show only for existing installs)
Function SkipIfNotExistingInstall
    StrCmp $upgradeInstallation 0 skip
    Return
    skip:
        Abort
FunctionEnd

; Skip for license/directory pages — fresh install only
Function SkipIfNotFreshInstall
    StrCmp $upgradeInstallation 0 noSkip
        Abort
    noSkip:
FunctionEnd

; Called just before the instfiles page — gives the user a chance to close VRCX
; themselves rather than being forced to kill it before they've chosen an action.
Function CheckVRCXNotRunning
    loop:
    StrCpy $1 "VRCX.exe"
    nsProcess::_FindProcess "$1"
    Pop $R1
    ${If} $R1 = 0
        MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
            "VRCX is still running.$\n$\nPlease close VRCX and click OK to continue, or Cancel to go back." \
            /SD IDOK IDCANCEL goBack
        nsExec::ExecToStack "taskkill /IM VRCX.exe"
        Sleep 1000
        Goto loop
    ${EndIf}
    Return
    goBack:
        Abort
FunctionEnd

; Skip finish page only for "update" action (it auto-launches instead)
Function SkipIfUpdate
    StrCmp $MaintenanceAction "update" skip
    Return
    skip:
        Abort
FunctionEnd

;--------------------------------
;Functions

; Maintenance page — shown when VRCX is already installed.
; Offers Update, Change Location, and Uninstall options.
Function MaintenancePage
    ; Skip for fresh installs
    StrCmp $upgradeInstallation 0 skipPage
    ; Skip if action is already determined (elevated re-launch)
    StrCmp $MaintenanceAction "" 0 skipPage

    !insertmacro MUI_HEADER_TEXT "VRCX is already installed" "What would you like to do?"

    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateRadioButton} 0 0u 100% 14u "Update VRCX"
    Pop $RadioUpdate

    ${NSD_CreateLabel} 16u 16u 100% 14u "Reinstall or update to the current version in-place."
    Pop $0

    ${NSD_CreateRadioButton} 0 36u 100% 14u "Change install location"
    Pop $RadioChange

    ${NSD_CreateLabel} 16u 52u 100% 14u "Move VRCX between AppData and Program Files."
    Pop $0

    ${NSD_CreateRadioButton} 0 72u 100% 14u "Uninstall VRCX"
    Pop $RadioUninstall

    ${NSD_CreateLabel} 16u 88u 100% 14u "Remove VRCX from this computer."
    Pop $0

    ; Default to Update
    ${NSD_Check} $RadioUpdate

    nsDialogs::Show
    Return

    skipPage:
        Abort
FunctionEnd

Function MaintenancePageLeave
    ${NSD_GetState} $RadioUninstall $0
    ${If} $0 = ${BST_CHECKED}
        ; Launch the uninstaller and close the installer
        ExecShell "" "$INSTDIR\Uninstall.exe"
        Quit
    ${EndIf}

    ${NSD_GetState} $RadioChange $0
    ${If} $0 = ${BST_CHECKED}
        StrCpy $MaintenanceAction "change"
        StrCpy $OldInstDir $INSTDIR
        StrCpy $OldInstMode $InstallMode

        ; If old install was in Program Files we need elevation now to be able to
        ; remove those files later, even if the new location ends up being AppData.
        ${If} $OldInstMode == "programfiles"
            UserInfo::GetAccountType
            Pop $0
            ${If} $0 != "Admin"
                ClearErrors
                ExecShell "runas" "$EXEPATH" "/CHANGE"
                ${If} ${Errors}
                    MessageBox MB_OK|MB_ICONEXCLAMATION \
                        "Could not obtain administrator privileges required to remove the Program Files installation."
                ${EndIf}
                Quit
            ${EndIf}
        ${EndIf}
    ${Else}
        StrCpy $MaintenanceAction "update"
    ${EndIf}
FunctionEnd

; Location page — shown for fresh installs and "change location" action.
Function InstallLocationPage
    ; Skip for "update" (keep current dir) and elevated re-launches (choice already made)
    ${If} $MaintenanceAction == "update"
        Abort
    ${EndIf}
    ${If} $ElevatedRelaunch = 1
        Abort
    ${EndIf}

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

    ; Pre-select based on current mode; for "change" default to the opposite of current
    ${If} $MaintenanceAction == "change"
        ${If} $OldInstMode == "programfiles"
            ${NSD_Check} $RadioAppData
        ${Else}
            ${NSD_Check} $RadioProgramFiles
        ${EndIf}
    ${ElseIf} $InstallMode == "programfiles"
        ${NSD_Check} $RadioProgramFiles
    ${Else}
        ${NSD_Check} $RadioAppData
    ${EndIf}

    nsDialogs::Show
FunctionEnd

Function InstallLocationPageLeave
    ${NSD_GetState} $RadioProgramFiles $0
    ${If} $0 = ${BST_CHECKED}
        StrCpy $InstallMode "programfiles"
        StrCpy $INSTDIR "$PROGRAMFILES64\VRCX"

        ; Block if the user picked the same location they're already installed to
        ${If} $MaintenanceAction == "change"
        ${AndIf} $OldInstMode == "programfiles"
            MessageBox MB_OK|MB_ICONEXCLAMATION \
                "VRCX is already installed to Program Files.$\nPlease choose a different location."
            Abort
        ${EndIf}

        UserInfo::GetAccountType
        Pop $0
        ${If} $0 != "Admin"
            MessageBox MB_OKCANCEL|MB_ICONINFORMATION \
                "Installing to Program Files requires administrator privileges.$\n$\nClick OK to restart the installer with elevated permissions, or Cancel to go back." \
                /SD IDOK IDCANCEL goBack
            ClearErrors
            ${If} $MaintenanceAction == "change"
                ExecShell "runas" "$EXEPATH" "/PROGRAMFILES /CHANGE"
            ${Else}
                ExecShell "runas" "$EXEPATH" "/PROGRAMFILES"
            ${EndIf}
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

        ; Block if the user picked the same location they're already installed to
        ${If} $MaintenanceAction == "change"
        ${AndIf} $OldInstMode == "appdata"
            MessageBox MB_OK|MB_ICONEXCLAMATION \
                "VRCX is already installed to AppData.$\nPlease choose a different location."
            Abort
        ${EndIf}
    ${EndIf}
FunctionEnd

Function .onInit
    ; Defaults
    StrCpy $upgradeInstallation 0
    StrCpy $InstallMode "appdata"
    StrCpy $INSTDIR "$LOCALAPPDATA\VRCX"
    StrCpy $MaintenanceAction ""
    StrCpy $OldInstDir ""
    StrCpy $OldInstMode ""
    StrCpy $ElevatedRelaunch 0

    ; Parse command line flags set by elevated re-launches
    ClearErrors
    ${GetParameters} $R0

    ${GetOptions} $R0 /UPDATE $R1
    ${IfNot} ${Errors}
        StrCpy $MaintenanceAction "update"
    ${EndIf}
    ClearErrors

    ${GetOptions} $R0 /CHANGE $R1
    ${IfNot} ${Errors}
        StrCpy $MaintenanceAction "change"
    ${EndIf}
    ClearErrors

    ${GetOptions} $R0 /PROGRAMFILES $R1
    ${IfNot} ${Errors}
        StrCpy $ElevatedRelaunch 1
    ${EndIf}
    ClearErrors

    ; Detect existing installation — check HKLM (Program Files) first, then HKCU (AppData)
    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "UninstallString"
    ${If} $R0 != ""
        StrCpy $upgradeInstallation 1
        ReadRegStr $R1 HKLM "Software\VRCX" "InstallDir"
        ${If} $R1 != ""
            StrCpy $INSTDIR $R1
        ${EndIf}
        StrCpy $InstallMode "programfiles"
    ${Else}
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

    ; For "change" action, snapshot the old location before any /PROGRAMFILES override
    ${If} $MaintenanceAction == "change"
        StrCpy $OldInstDir $INSTDIR
        StrCpy $OldInstMode $InstallMode
    ${EndIf}

    ; /PROGRAMFILES override — user already chose Program Files on the location page
    ${If} $ElevatedRelaunch = 1
        StrCpy $InstallMode "programfiles"
        StrCpy $INSTDIR "$PROGRAMFILES64\VRCX"
        ; If this is an elevated upgrade re-launch with no explicit action, mark as update
        ${If} $upgradeInstallation = 1
        ${AndIf} $MaintenanceAction == ""
            StrCpy $MaintenanceAction "update"
        ${EndIf}
    ${EndIf}

    ; For "update" to Program Files, elevate immediately if not already admin
    ${If} $upgradeInstallation = 1
    ${AndIf} $MaintenanceAction == "update"
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

FunctionEnd

Function .onInstSuccess
    ; Auto-launch after an in-place update (finish page is skipped for updates)
    ${If} $MaintenanceAction == "update"
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

    ${If} $MaintenanceAction == "change"
        ; Remove the old installation silently before installing to the new location.
        ; _?= makes ExecWait actually wait for completion.
        DetailPrint "Removing previous installation from $OldInstDir..."
        ExecWait '"$OldInstDir\Uninstall.exe" /S _?=$OldInstDir'
        Delete "$OldInstDir\Uninstall.exe"

    ${ElseIf} $upgradeInstallation = 1
        ; In-place update — uninstall current version first
        DetailPrint "Uninstalling previous version..."
        ExecWait '"$INSTDIR\Uninstall.exe" /S _?=$INSTDIR'
        Delete "$INSTDIR\Uninstall.exe"

    ${Else}
        ; Fresh install — ensure the Visual C++ Redistributable is present
        inetc::get "https://aka.ms/vs/17/release/vc_redist.x64.exe" $TEMP\vcredist_x64.exe
        ExecWait "$TEMP\vcredist_x64.exe /install /quiet /norestart"
        Delete "$TEMP\vcredist_x64.exe"

    ${EndIf}

    SetOutPath "$INSTDIR"
    File /r /x *.log /x *.pdb "..\build\Cef\*.*"
    WriteUninstaller "$INSTDIR\Uninstall.exe"

    ; Write registry entries into the appropriate hive
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

Function un.DataDeletionPage
    StrCpy $DeleteUserData 0

    !insertmacro MUI_HEADER_TEXT "Remove User Data" "Optionally delete your VRCX database and settings"

    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateLabel} 0 0 100% 30u "VRCX stores your database, settings, and logs in:$\n$APPDATA\VRCX"
    Pop $0

    ${NSD_CreateCheckbox} 0 38u 100% 14u "Also delete all user data (database, settings, logs, cache)"
    Pop $CheckboxDeleteData

    ${NSD_CreateLabel} 0 58u 100% 40u "Warning: this cannot be undone. Your friend logs, world history, \
and all other VRCX data will be permanently deleted."
    Pop $0

    nsDialogs::Show
FunctionEnd

Function un.DataDeletionPageLeave
    ${NSD_GetState} $CheckboxDeleteData $0
    ${If} $0 = ${BST_CHECKED}
        MessageBox MB_YESNO|MB_ICONEXCLAMATION|MB_DEFBUTTON2 \
            "Are you sure you want to delete all VRCX user data?$\n$\n\
This includes your:$\n\
  - Friend log database$\n\
  - World and player history$\n\
  - App settings$\n\
  - Logs and cache$\n$\n\
Located at: $APPDATA\VRCX$\n$\n\
This action CANNOT be undone." \
            IDYES confirmed
        ${NSD_Uncheck} $CheckboxDeleteData
        Abort
        confirmed:
            StrCpy $DeleteUserData 1
    ${EndIf}
FunctionEnd

Function un.onInit
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
    StrCpy $1 "VRCX.exe"
    nsProcess::_FindProcess "$1"
    Pop $R1
    ${If} $R1 = 0
        MessageBox MB_OK|MB_ICONEXCLAMATION \
            "VRCX is still running. Cannot uninstall.$\nPlease close VRCX and try again." /SD IDOK
        Abort
    ${EndIf}

    RMDir /r "$INSTDIR"

    ${If} $DeleteUserData = 1
        RMDir /r "$APPDATA\VRCX"
        DetailPrint "Deleted user data: $APPDATA\VRCX"
    ${EndIf}

    ; Clean both hives — handles migration scenarios
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
