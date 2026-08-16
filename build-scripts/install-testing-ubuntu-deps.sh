#!/bin/bash
set -euo pipefail

# Check what OS and we are using sudo
source /etc/os-release 2>/dev/null || { echo "This script requires /etc/os-release to detect the operating system." >&2; exit 1; }
[[ "${EUID}" -ne 0 ]] && { echo "Please run this script using sudo." >&2; exit 1; }
case "${ID:-}" in
    ubuntu)
        [[ "${VERSION_ID%%.*}" -ge 24 ]] || { echo "This script requires Ubuntu 24.04 or newer." >&2; exit 1; }

        echo "Installing Ubuntu dependencies"
        cd ~/

        # Install .NET Host, 7zip for packaging
        sudo apt-get install dotnet-sdk-10.0 7zip

        # Download the PowerShell package file
        wget -q --show-progress https://github.com/PowerShell/PowerShell/releases/download/v7.6.4/powershell_7.6.4-1.deb_amd64.deb

        # Install the PowerShell package
        sudo dpkg -i powershell_7.6.4-1.deb_amd64.deb

        # Resolve missing dependencies and finish the install (if necessary)
        sudo apt-get install -f

        # Delete the downloaded package file
        rm powershell_7.6.4-1.deb_amd64.deb

        # Install node.js, copies the contents of the node package to /usr/local/ to make it available globally.
        wget -q --show-progress https://nodejs.org/dist/v24.16.0/node-v24.16.0-linux-x64.tar.xz
        tar -xf node-v24.16.0-linux-x64.tar.xz
        sudo cp -r node-v24.16.0-linux-x64/* /usr/local/
        rm -rf node-v24.16.0-linux-x64.tar.xz node-v24.16.0-linux-x64/

        ;;

    cachyos | arch)

        echo "Installing Arch dependencies"
        cd ~/

        # Install .NET Host, 7zip, node.js
        sudo pacman -S --needed dotnet-sdk-10.0 7zip nodejs npm

        # Install PowerShell from the AUR using paru
        paru -S --needed powershell-bin

        echo "You may need to restart your shell."

        ;;

    *)
        echo "This script requires Ubuntu 24.04+, CachyOS, or Arch." >&2
        exit 1
        ;;
esac
