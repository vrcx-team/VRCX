#!/bin/bash
set -euo pipefail

# Check we are running on Ubuntu 24+ and using sudo (nothing else is tested)
source /etc/os-release 2>/dev/null || { echo "This script requires /etc/os-release to detect the operating system." >&2; exit 1; }
[[ "${ID:-}" != "ubuntu" || "${VERSION_ID%%.*}" -lt 24 ]] && { echo "This script requires Ubuntu 24.04 or newer." >&2; exit 1; }
[[ "${EUID}" -ne 0 ]] && { echo "Please run this script using sudo." >&2; exit 1; }

cd ~/

# Install .NET Host
sudo apt-get install dotnet-sdk-10.0

# Download the PowerShell package file
wget -q --show-progress https://github.com/PowerShell/PowerShell/releases/download/v7.6.4/powershell_7.6.4-1.deb_amd64.deb

# Install the PowerShell package
sudo dpkg -i powershell_7.6.4-1.deb_amd64.deb

# Resolve missing dependencies and finish the install (if necessary)
sudo apt-get install -f

# Delete the downloaded package file
rm powershell_7.6.4-1.deb_amd64.deb

# Install 7zip for packaging
sudo apt-get install 7zip

# Install node.js, copies the contents of the node package to /usr/local/ to make it available globally.
wget -q --show-progress https://nodejs.org/dist/v24.16.0/node-v24.16.0-linux-x64.tar.xz
tar -xf node-v24.16.0-linux-x64.tar.xz
sudo cp -r node-v24.16.0-linux-x64/* /usr/local/
rm -rf node-v24.16.0-linux-x64.tar.xz node-v24.16.0-linux-x64/

# Install fuse2 support, required for the AppImage
sudo apt-get install libfuse2t64
