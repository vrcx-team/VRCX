;--------------------------------
;Plugins
;https://nsis.sourceforge.io/ApplicationID_plug-in
;https://nsis.sourceforge.io/ShellExecAsUser_plug-in
;https://nsis.sourceforge.io/NsProcess_plugin

;--------------------------------
;Include Modern UI

    !include "MUI2.nsh"
    !include "FileFunc.nsh"
    !include "LogicLib.nsh"

;--------------------------------
;General

    !define VRCX_BASEDIR "..\bin\x64\Release"

    Unicode True
    Name "VRCX"
    OutFile "VRCX_Setup.exe"
    InstallDir "$PROGRAMFILES64\VRCX"
    InstallDirRegKey HKLM "Software\VRCX" "InstallDir"
    RequestExecutionLevel admin
    ShowInstDetails show

;--------------------------------
;Variables

    VAR upgradeInstallation

;--------------------------------
;Interface Settings

    !define MUI_ABORTWARNING

;--------------------------------
;Pages

    !insertmacro MUI_PAGE_LICENSE "..\LICENSE"
    !define MUI_PAGE_CUSTOMFUNCTION_PRE dirPre
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
    !insertmacro MUI_PAGE_FINISH

    !insertmacro MUI_UNPAGE_CONFIRM
    !insertmacro MUI_UNPAGE_INSTFILES
    !insertmacro MUI_UNPAGE_FINISH

;--------------------------------
;Languages

    !insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Macros

;--------------------------------
;Functions

Function dirPre
    StrCmp $upgradeInstallation "true" 0 +2
        Abort
FunctionEnd

Function .onInit
    StrCpy $upgradeInstallation "false"

    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "UninstallString"
    StrCmp $R0 "" done

    ; If VRCX is already running, display a warning message and exit
    StrCpy $1 "VRCX.exe"
    nsProcess::_FindProcess "$1"
    Pop $R1
    ${If} $R1 = 0
        MessageBox MB_OK|MB_ICONEXCLAMATION "VRCX is still running. Cannot install this software.$\nPlease close VRCX and try again." /SD IDOK
        Abort
    ${EndIf}

    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "VRCX is already installed. $\n$\nClick `OK` to upgrade the existing installation or `Cancel` to cancel this upgrade." /SD IDOK IDCANCEL cancel
        Goto next
    cancel:
        Abort
    next:
        StrCpy $upgradeInstallation "true"

    done:
    ${If} $upgradeInstallation == "false"
        SetSilent normal
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

    StrCmp $upgradeInstallation "true" 0 noupgrade
        DetailPrint "Uninstall previous version..."
        ExecWait '"$INSTDIR\Uninstall.exe" /S _?=$INSTDIR'
        Delete $INSTDIR\Uninstall.exe
        Goto afterupgrade

    noupgrade:

    afterupgrade:

    SetOutPath "$INSTDIR"

    File /r /x *.json /x *.sqlite3 /x *.pdb /x userdata /x cache "..\bin\x64\Release\*.*"

    WriteRegStr HKLM "Software\VRCX" "InstallDir" $INSTDIR
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "DisplayName" "VRCX"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "DisplayIcon" "$\"$INSTDIR\VRCX.ico$\""

    ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKLM  "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX" "EstimatedSize" "$0"

    CreateShortCut "$SMPROGRAMS\VRCX.lnk" "$INSTDIR\VRCX.exe"
    ApplicationID::Set "$SMPROGRAMS\VRCX.lnk" "VRCX"

    WriteRegStr HKCU "Software\Classes\vrcx" "" "URL:vrcx"
    WriteRegStr HKCU "Software\Classes\vrcx" "FriendlyTypeName" "VRCX"
    WriteRegStr HKCU "Software\Classes\vrcx" "URL Protocol" ""
    WriteRegExpandStr HKCU "Software\Classes\vrcx\DefaultIcon" "" "$INSTDIR\VRCX.ico"
    WriteRegStr HKCU "Software\Classes\vrcx\shell" "" "open"
    WriteRegStr HKCU "Software\Classes\vrcx\shell\open" "FriendlyAppName" "VRCX"
    WriteRegStr HKCU "Software\Classes\vrcx\shell\open\command" "" '"D:\WindowsFiles\Documents\git\VRCX\bin\x64\Release\VRCX.exe" /uri="%1" /params="%2 %3 %4"'

    ${If} ${Silent}
        SetOutPath $INSTDIR
        ShellExecAsUser::ShellExecAsUser "" "$INSTDIR\VRCX.exe" ""
    ${EndIf}

SectionEnd

;--------------------------------
;Uninstaller Section

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

    DeleteRegKey HKLM "Software\VRCX"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\VRCX"
    DeleteRegKey HKCU "Software\Classes\vrcx"

    Delete "$SMPROGRAMS\VRCX.lnk"

    ${IfNot} ${Silent}
        Delete "$DESKTOP\VRCX.lnk"
    ${EndIf}
SectionEnd
