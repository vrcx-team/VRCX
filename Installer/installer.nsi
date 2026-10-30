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
    VIAddVersionKey "ProductName" "Nexy"
    VIAddVersionKey "ProductVersion" "${PRODUCT_VERSION}"
    VIAddVersionKey "LegalCopyright" "Copyright Nexy contributors"
    VIAddVersionKey "FileDescription" "Friendship management tool for NexVR"
    VIAddVersionKey "Comments" "Nexy is a fork of VRCX (https://github.com/vrcx-team/VRCX)"

;--------------------------------
;Include Modern UI

    !include "MUI2.nsh"
    !include "FileFunc.nsh"
    !include "LogicLib.nsh"

;--------------------------------
;General

    SetCompressor /SOLID lzma
    SetCompressorDictSize 16
    Unicode True
    Name "Nexy"
    OutFile "Nexy_Setup_x64.exe"
    InstallDir "$PROGRAMFILES64\Nexy"
    InstallDirRegKey HKLM "Software\Nexy" "InstallDir"
    RequestExecutionLevel admin
    ShowInstDetails show

;--------------------------------
;Variables

    VAR upgradeInstallation

;--------------------------------
;Interface Settings

    !define MUI_ABORTWARNING

;--------------------------------
;Icons

    !define MUI_ICON "../images/Nexy.ico"
    !define MUI_UNICON "../images/Nexy.ico"

;--------------------------------
;Pages

    !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfUpgrade
    !insertmacro MUI_PAGE_LICENSE "..\LICENSE"

    !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfUpgrade
    !insertmacro MUI_PAGE_DIRECTORY

    !insertmacro MUI_PAGE_INSTFILES

    ;------------------------------
    ; Finish Page

    ; Checkbox to launch Nexy.
    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_TEXT "Launch Nexy"
    !define MUI_FINISHPAGE_RUN_FUNCTION launchNexy

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
;Macros

;--------------------------------
;Functions

Function SkipIfUpgrade
    StrCmp $upgradeInstallation 0 noUpgrade
        Abort
    noUpgrade:
FunctionEnd

Function .onInit
    StrCpy $upgradeInstallation 0

    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexy" "UninstallString"
    StrCmp $R0 "" notInstalled
        StrCpy $upgradeInstallation 1
    notInstalled:

    ; The updater exits before launching this installer. Do not kill every
    ; VRCX.exe process: the original VRCX application may also be running.
FunctionEnd

Function .onInstSuccess
    ${If} $upgradeInstallation = 1
        Call launchNexy
    ${EndIf}
FunctionEnd

Function createDesktopShortcut
    CreateShortcut "$DESKTOP\Nexy.lnk" "$INSTDIR\Nexy.exe"
FunctionEnd

Function launchNexy
    SetOutPath $INSTDIR
    ShellExecAsUser::ShellExecAsUser "" "$INSTDIR\Nexy.exe" ""
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

    WriteRegStr HKLM "Software\Nexy" "InstallDir" $INSTDIR
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexy" "DisplayName" "Nexy"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexy" "Publisher" "Nexy contributors"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexy" "DisplayVersion" "${VERSION}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexy" "DisplayArch" "x64"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexy" "InstallLocation" "$INSTDIR"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexy" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexy" "DisplayIcon" "$\"$INSTDIR\Nexy.ico$\""

    ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
    IntFmt $0 "0x%08X" $0
    WriteRegDWORD HKLM  "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexy" "EstimatedSize" "$0"

    ${GetParameters} $R2
    ${GetOptions} $R2 /SKIP_SHORTCUT= $3
    StrCmp $3 "true" noShortcut
        CreateShortCut "$SMPROGRAMS\Nexy.lnk" "$INSTDIR\Nexy.exe"
        ApplicationID::Set "$SMPROGRAMS\Nexy.lnk" "Nexy"
    noShortcut:

    ; Nexy owns a separate URI scheme, never the original VRCX scheme.
    WriteRegStr HKLM "Software\Classes\nexy" "" "URL:nexy"
    WriteRegStr HKLM "Software\Classes\nexy" "FriendlyTypeName" "Nexy"
    WriteRegStr HKLM "Software\Classes\nexy" "URL Protocol" ""
    WriteRegStr HKLM "Software\Classes\nexy\DefaultIcon" "" "$INSTDIR\Nexy.ico"
    WriteRegStr HKLM "Software\Classes\nexy\shell\open" "FriendlyAppName" "Nexy"
    WriteRegStr HKLM "Software\Classes\nexy\shell\open\command" "" '"$INSTDIR\Nexy.exe" /uri="%1"'

SectionEnd

;--------------------------------
;Uninstaller Section

Section "Uninstall"
    ; Rely on Windows file-in-use handling; do not block uninstall because
    ; the unrelated VRCX application happens to be running.

    RMDir /r "$INSTDIR"

    DeleteRegKey HKLM "Software\Classes\nexy"
    DeleteRegKey HKLM "Software\Nexy"
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\Nexy"

    ${IfNot} ${Silent}
        Delete "$SMPROGRAMS\Nexy.lnk"
        Delete "$DESKTOP\Nexy.lnk"
    ${EndIf}
SectionEnd