/* eslint-env node */
/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
    appId: 'app.vrcx',
    productName: 'VRCX',
    icon: 'images/VRCX.png',
    files: [
        'build/html/**/*',
        'src-electron/*',
        'images/VRCX.png',
        'images/VRCX.ico',
        'images/VRCX_notify.png',
        'images/VRCX_notify.ico',
        'Version',
        'src-electron/libs/linux/libopenvr_api.so',
        '.no-updater'
    ],
    asarUnpack: [
        'node_modules/node-api-dotnet/**/*',
        'node_modules/node-api-dotnet/net10.0/**/*',
        'build/Electron/*',
        'build/Electron/**',
        'build/Electron/dotnet-runtime/**/*',
        'src-electron/libs/linux/libopenvr_api.so'
    ],
    extraResources: [
        {
            from: 'build/Electron/',
            to: 'app.asar.unpacked/build/Electron/'
        },
        {
            from: 'node_modules/node-api-dotnet/net10.0/Microsoft.JavaScript.NodeApi.dll',
            to: 'app.asar.unpacked/node_modules/node-api-dotnet/net10.0/Microsoft.JavaScript.NodeApi.dll'
        },
        {
            from: 'node_modules/node-api-dotnet/net10.0/Microsoft.JavaScript.NodeApi.DotNetHost.dll',
            to: 'app.asar.unpacked/node_modules/node-api-dotnet/net10.0/Microsoft.JavaScript.NodeApi.DotNetHost.dll'
        },
        {
            from: 'build/Electron/dotnet-runtime/',
            to: 'dotnet-runtime/'
        },
        {
            from: 'src-electron/libs/linux/libopenvr_api.so',
            to: 'bin/libopenvr_api.so'
        },
        {
            from: 'src-electron/libs/linux/libopenvr_api.so',
            to: 'app.asar.unpacked/build/Electron/openvr_api.so'
        }
    ],
    directories: {
        output: 'build'
    },
    linux: {
        artifactName: 'VRCX_Version.${ext}',
        target: ['AppImage'],
        icon: 'images/VRCX.png',
        category: 'Utility',
        executableName: 'vrcx',
        mimeTypes: ['x-scheme-handler/vrcx'],
        desktop: {
            entry: {
                Name: 'VRCX',
                Comment: 'Friendship management tool for VRChat',
                Icon: 'VRCX',
                Terminal: 'false',
                Type: 'Application',
                Categories: 'Utility;Application;',
                StartupWMClass: 'VRCX',
                MimeType: 'x-scheme-handler/vrcx;'
            }
        },
        maintainer: 'rs189 <35667100+rs189@users.noreply.github.com>',
        description: 'Friendship management tool for VRChat',
        syncDesktopName: true
    },
    mac: {
        artifactName: 'VRCX_Version.${ext}',
        target: ['dmg'],
        icon: 'images/VRCX.png',
        category: 'public.app-category.utilities',
        executableName: 'VRCX'
    },
    toolsets: {
        appimage: '1.0.3'
    }
};
