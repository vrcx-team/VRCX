const path = require('path');
const { patchFile } = require('./patch-node-api-dotnet');

/**
 * Electron-builder afterPack hook. Applies the node-api-dotnet path patch to
 * the packed app before installers (NSIS, AppImage, dmg) are made from it.
 * The postbuild-electron script patches only the unpacked folder, which on
 * Windows happens after the installer has already been built.
 *
 * @param {import('electron-builder').AfterPackContext} context
 */
exports.default = async function afterPack(context) {
    const resourcesDir =
        context.electronPlatformName === 'darwin'
            ? path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`, 'Contents', 'Resources')
            : path.join(context.appOutDir, 'resources');
    console.log('Patching packed init.js...');
    patchFile(path.join(resourcesDir, 'app.asar.unpacked', 'node_modules', 'node-api-dotnet', 'init.js'));
};
