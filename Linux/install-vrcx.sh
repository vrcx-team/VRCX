#!/usr/bin/env bash
# Made by galister

# change me
steamapps=$HOME/.local/share/Steam/steamapps/compatdata
download_url=https://github.com/vrcx-team/VRCX/releases/download/v2024.05.09/VRCX_20240509.zip

export WINEPREFIX=$HOME/.local/share/vrcx

set -e

# Ensure Wine version >= 9.0
wine_version=$(wine64 --version | grep -Po '(?<=wine-)([0-9.]+)')
if [ "$1" != "force" ] && [[ $wine_version < 9.0 ]]; then
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

winetricks --force -q corefonts

echo "Download VRCX"

if [[ ! -d $WINEPREFIX/drive_c/vrcx ]]; then
	mkdir -p $WINEPREFIX/drive_c/vrcx
fi

cd $WINEPREFIX/drive_c/vrcx
wget -q --show-progress $download_url -O vrcx.zip
unzip -uq vrcx.zip
rm vrcx.zip

echo '#!/usr/bin/env bash 
export WINEPREFIX=$HOME/.local/share/vrcx
wine64 $WINEPREFIX/drive_c/vrcx/VRCX.exe -no-cef-sandbox' >~/.local/share/vrcx/drive_c/vrcx/vrcx
chmod +x ~/.local/share/vrcx/drive_c/vrcx/vrcx

if [[ -d ~/.local/bin ]]; then
	echo "Install VRCX to ~/.local/bin"
	ln -s ~/.local/share/vrcx/drive_c/vrcx/vrcx ~/.local/bin/vrcx || true
fi

if [[ -d $HOME/.local/share/applications ]]; then
	if [[ ! -f $HOME/.local/share/icons/VRCX.png ]]; then
		echo "Install VRCX.png to ~/.local/share/icons"
		cd ~/.local/share/icons/
		wget -q --show-progress https://raw.githubusercontent.com/vrcx-team/VRCX/master/VRCX.png
	fi

	echo "Install vrcx.desktop to ~/.local/share/applications"
	echo "[Desktop Entry]
Type=Application
Name=VRCX
Categories=Utility;
Exec=/home/$USER/.local/share/vrcx/drive_c/vrcx/vrcx
Icon=VRCX
" >~/.local/share/applications/vrcx.desktop
fi

echo "Done! Check your menu for VRCX."
