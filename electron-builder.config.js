/* eslint-env node */
/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
module.exports = {
    appId: 'app.nexy',
    productName: 'Nexy',
    icon: 'images/Nexy.png',
    files: [
        'build/html/**/*',
        'src-electron/*',
        'images/Nexy.png',
        'images/Nexy.ico',
        'images/Nexy_notify.png',
        'images/Nexy_notify.ico',
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
            from: `build/Electron/${process.platform === 'darwin' ? 'osx' : '${os}'}-\${arch}/`,
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
    // patch node-api-dotnet before the installer is made, not after
    afterPack: './build-scripts/after-pack.js',
    linux: {
        artifactName: 'Nexy_Version.${ext}',
        target: ['AppImage'],
        icon: 'images/Nexy.png',
        executableName: 'Nexy',
        mimeTypes: ['x-scheme-handler/nexy'],
        desktop: {
            entry: {
                Name: 'Nexy',
                Comment: 'Friendship management tool for NexVR',
                Icon: 'Nexy',
                Terminal: 'false',
                Type: 'Application',
                Categories: 'Utility;Application;',
                StartupWMClass: 'Nexy',
                MimeType: 'x-scheme-handler/nexy;'
            }
        },
        maintainer: 'rs189 <35667100+rs189@users.noreply.github.com>',
        description: 'Friendship management tool for NexVR',
        syncDesktopName: true
    },
    mac: {
        artifactName: 'Nexy_Version.${ext}',
        target: ['dmg'],
        icon: 'images/Nexy.png',
        category: 'public.app-category.utilities',
        executableName: 'Nexy',
        minimumSystemVersion: '14.0'
    },
    win: {
        artifactName: 'Nexy_Version.${ext}',
        target: ['nsis'],
        icon: 'images/Nexy.ico'
    },
    toolsets: {
        appimage: '1.0.3'
    }
};
