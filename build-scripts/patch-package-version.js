const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const versionFilePath = path.join(rootDir, 'Version');
const packageJsonPath = path.join(rootDir, 'package.json');

let version = '';
try {
    version = fs.readFileSync(versionFilePath, 'utf8').trim();
    var index = version.indexOf('T');
    if (index > 0) {
        // Remove time part from version
        version = version.substring(0, index).replaceAll('-', '.');
    }
    if (!version || version === 'Nightly Build') {
        version = new Date().toISOString().split('T')[0].replaceAll('-', '.');
    }
} catch (err) {
    console.error('Error reading Version file:', err);
    process.exit(1);
}

let packageJson = {};
try {
    const packageData = fs.readFileSync(packageJsonPath, 'utf8');
    packageJson = JSON.parse(packageData);
} catch (err) {
    console.error('Error reading package.json:', err);
    process.exit(1);
}

packageJson.version = version;

try {
    fs.writeFileSync(
        packageJsonPath,
        JSON.stringify(packageJson, null, 4),
        'utf8'
    );
    console.log(`Updated version in package.json to: ${version}`);
} catch (err) {
    console.error('Error writing to package.json:', err);
    process.exit(1);
}
