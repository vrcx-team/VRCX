#!/usr/bin/env bash

steamapps=$HOME/.local/share/Steam/steamapps/compatdata
stable="https://api0.vrcx.app/releases/stable/latest/download"
nightly="https://api0.vrcx.app/releases/nightly/latest/download"
download_url=$stable
XDG_DATA_HOME=${XDG_DATA_HOME:=$HOME/.local/share}

export WINEPREFIX="$XDG_DATA_HOME"/vrcx
export WINEARCH=win64

set -e
set -u

# Ensure Wine version >= 9.0
wine_version=$(wine --version | grep -Po '(?<=wine-)([0-9.]+)')
if [ "${1-}" != "force" ] && [[ $wine_version < 9.0 ]]; then
	echo "Please upgrade your Wine version to 9.0 or higher."
	echo "If you want to try anyway, run: install-vrcx.sh force"
	exit 1
fi

if ! [ -x "$(command -v winetricks)" ]; then
  echo "You don't have winetricks installed or 'command -v winetricks' doesn't recongize it, you will want it for corefonts."
  exit 1
fi


if [[ ! -d $WINEPREFIX ]]; then
	echo "Creating Wine prefix."
	logs=$(winecfg /v win10 2>&1)
	if [ "$?" -ne "0" ]; then
		echo "*********** Error while creating Wine prefix ***********"
		echo "$logs"
		echo "*********** Error while creating Wine prefix ***********"
		exit 1
	fi
fi

if [[ ! -d $steamapps ]] && [[ -d $HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/compatdata ]]; then
	echo "Flatpak Steam detected."
	steamapps=$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam/steamapps/compatdata
fi

vrc_appdata=$steamapps/438100/pfx/drive_c/users/steamuser/AppData/LocalLow/VRChat/VRChat
vrc_dst=$WINEPREFIX/drive_c/users/$USER/AppData/LocalLow/VRChat/VRChat

if [[ ! -d $vrc_appdata ]]; then
	echo "No VRC installation detected."
	echo "If you want to use VRC on this computer, please install it now and start it once."
	echo "Otherwise, you will lose out on some features, like Game Log"
	read -p "Press enter to continue"
fi

if [[ -d $vrc_appdata ]] && [[ ! -d $vrc_dst ]]; then
	echo "Link VRChat AppData into Wine Prefix"
	mkdir -p $(dirname $vrc_dst)
	ln -s $vrc_appdata $vrc_dst
fi

winetricks --force -q corefonts # Workaround for https://bugs.winehq.org/show_bug.cgi?id=32342

echo "Download VRCX"
INSTALL_LOCATION="$WINEPREFIX/drive_c/Program Files/VRCX"

if [[ ! -d $INSTALL_LOCATION ]]; then
	mkdir -p "$INSTALL_LOCATION"
else
   rm -rf "${INSTALL_LOCATION:?}/"*
fi

cd "$INSTALL_LOCATION"
curl -L $download_url -o vrcx_setup.exe
WINEPREFIX=$WINEPREFIX wine vrcx_setup.exe /S /SKIP_SHORTCUT=true
rm vrcx_setup.exe


# Install twemoji font as Segoe UI is proprietary and not included in wine
echo "Download twemoji font."
curl -L https://raw.githubusercontent.com/vrcx-team/VRCX/master/Linux/fonts/seguiemj.ttf -o seguiemj.ttf
echo "Install twemoji font."
cp seguiemj.ttf "$WINEPREFIX/drive_c/windows/Fonts"
WINEPREFIX=$WINEPREFIX wine reg add 'HKLM\Software\Microsoft\Windows NT\CurrentVersion\Fonts' /v 'seguiemj' /t REG_SZ /d 'seguiemj.ttf' /f
rm seguiemj.ttf

curl -L https://raw.githubusercontent.com/vrcx-team/VRCX/master/Linux/vrcx.sh -o $WINEPREFIX/drive_c/vrcx.sh
chmod +x $WINEPREFIX/drive_c/vrcx.sh

curl -L https://raw.githubusercontent.com/vrcx-team/VRCX/master/Linux/winediscordipcbridge.exe -o $WINEPREFIX/drive_c/winediscordipcbridge.exe

echo "Install VRCX.png to $XDG_DATA_HOME/icons"
curl -L https://raw.githubusercontent.com/vrcx-team/VRCX/master/VRCX.png -o "$XDG_DATA_HOME/icons/VRCX.png"

echo "Install vrcx.exe.desktop to $XDG_DATA_HOME/applications"
echo "[Desktop Entry]
Type=Application
Name=VRCX
Categories=Utility;
Exec=$WINEPREFIX/drive_c/vrcx.sh
Icon=VRCX
" > $XDG_DATA_HOME/applications/vrcx.exe.desktop


echo "Done! Check your menu for VRCX."
