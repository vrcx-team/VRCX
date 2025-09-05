const fs = require('fs');
const path = require('path');
const { getArchAndPlatform } = require('./utils');

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

    console.log(`No changes needed for: ${filePath}`);
    return false;
}

function patchNodeApiDotNet(arch, platform) {
    let platformName = '';
    switch (platform) {
        case 'win32':
            platformName = 'win';
            break;
        case 'darwin':
            platformName = 'mac';
            break;
        case 'linux':
            platformName = 'linux';
            break;
    }
    if (arch === 'arm64') {
        platformName += '-arm64';
    }

    const postBuildPath = path.join(
        __dirname,
        `./../build/${platformName}-unpacked/resources/app.asar.unpacked/node_modules/node-api-dotnet/init.js`
    );
    console.log('Patching post-build init.js...');
    patchFile(postBuildPath);
}

const { arch, platform } = getArchAndPlatform();
patchNodeApiDotNet(arch, platform);
