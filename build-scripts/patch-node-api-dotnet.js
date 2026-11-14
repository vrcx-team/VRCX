const fs = require('fs');
const path = require('path');
const { getArchAndPlatform } = require('./utils');

/**
 * Patches a file with the specified path
 *
 * @param {string} filePath
 * @returns {boolean} True if the file was patched, false otherwise
 */
function patchFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: ${filePath} does not exist.`);
        return false;
    }

    let fileContent = fs.readFileSync(filePath, 'utf8');

    const regex =
        /const\s+managedHostPath\s*=\s*__dirname\s*\+\s*`\/\$\{targetFramework\}\/\$\{assemblyName\}\.DotNetHost\.dll`/;

    const newContent = fileContent.replace(
        regex,
        `let managedHostPath = __dirname + \`/\${targetFramework}/\${assemblyName}.DotNetHost.dll\`;
managedHostPath = managedHostPath.indexOf('app.asar.unpacked') < 0 ?
  managedHostPath.replace('app.asar', 'app.asar.unpacked') : managedHostPath;`
    );

    if (fileContent !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Patched: ${filePath}`);

        return true;
    }

    if (fileContent.includes("managedHostPath.indexOf('app.asar.unpacked')")) {
        console.log(`Already patched: ${filePath}`);
        return true;
    }

    console.log(`No changes needed for: ${filePath}`);
    return false;
}

/**
 * Patches the node-api-dotnet module for the specified architecture and platform
 *
 * @param {string} arch
 * @param {string} platform
 * @returns {void}
 */
function patchNodeApiDotNet(arch, platform) {
    const platformName = { win32: 'win', darwin: 'mac', linux: 'linux' }[platform];
    if (!platformName) {
        throw new Error(`Unsupported platform: ${platform}`);
    }

    const appName = `${platformName}-${arch}`;
    const resourcePath =
        platform === 'darwin'
            ? path.join('build', appName, 'VRCX.app', 'Contents', 'Resources')
            : path.join('build', `${appName}-unpacked`, 'resources');
    const postBuildPath = path.join(
        __dirname,
        '..',
        resourcePath,
        'app.asar.unpacked',
        'node_modules',
        'node-api-dotnet',
        'init.js'
    );
    console.log('Patching post-build init.js...');
    if (!patchFile(postBuildPath)) {
        throw new Error(`Unable to patch packaged node-api-dotnet at ${postBuildPath}`);
    }
}

const { arch, platform } = getArchAndPlatform();
patchNodeApiDotNet(arch, platform);
