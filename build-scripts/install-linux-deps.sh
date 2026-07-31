#!/bin/bash

cd ~/

# Download the PowerShell package file
wget -q https://github.com/PowerShell/PowerShell/releases/download/v7.6.2/powershell_7.6.2-1.deb_amd64.deb

# Install the PowerShell package
sudo dpkg -i powershell_7.6.2-1.deb_amd64.deb

# Resolve missing dependencies and finish the install (if necessary)
sudo apt-get install -f

# Delete the downloaded package file
rm powershell_7.6.2-1.deb_amd64.deb

# Install 7zip for packaging
sudo apt-get install 7zip

# Install .NET Host
sudo apt-get install dotnet-sdk-10.0

# Install node.js, copies the contents of the node package to /usr/local/ to make it available globally.
wget -q https://nodejs.org/dist/v24.16.0/node-v24.16.0-linux-x64.tar.xz
tar -xf node-v24.16.0-linux-x64.tar.xz
sudo cp -r node-v24.16.0-linux-x64/* /usr/local/
rm -rf node-v24.16.0-linux-x64.tar.xz node-v24.16.0-linux-x64/

# Install fuse2 support, required for the AppImage
sudo apt-get install libfuse2t64