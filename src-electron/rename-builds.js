const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const versionFilePath = path.join(rootDir, 'Version');
const buildDir = path.join(rootDir, 'build');

let version = '';
try {
    version = fs.readFileSync(versionFilePath, 'utf8').trim();
} catch (err) {
    console.error('Error reading Version file:', err);
    process.exit(1);
}

const oldAppImage = path.join(buildDir, `VRCX_Version.AppImage`);
const oldTarXz = path.join(buildDir, `VRCX_Version.tar.xz`);

const newAppImage = path.join(buildDir, `VRCX_${version}.AppImage`);
const newTarXz = path.join(buildDir, `VRCX_${version}.tar.xz`);

try {
    if (fs.existsSync(oldAppImage)) {
        fs.renameSync(oldAppImage, newAppImage);
        console.log(`Renamed: ${oldAppImage} -> ${newAppImage}`);
    } else {
        console.log(`File not found: ${oldAppImage}`);
    }

    if (fs.existsSync(oldTarXz)) {
        fs.renameSync(oldTarXz, newTarXz);
        console.log(`Renamed: ${oldTarXz} -> ${newTarXz}`);
    } else {
        console.log(`File not found: ${oldTarXz}`);
    }
} catch (err) {
    console.error('Error renaming files:', err);
    process.exit(1);
}
