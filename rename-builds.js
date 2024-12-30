const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, 'Version');
const buildDir = path.join(__dirname, 'build');

let version = '';
try {
  version = fs.readFileSync(versionFilePath, 'utf8').trim();
} catch (err) {
  console.error('Error reading Version file:', err);
  process.exit(1);
}

const formattedVersion = version.replace(/\./g, '');

const oldAppImage = path.join(buildDir, `VRCX_Version.AppImage`);
const oldTarXz = path.join(buildDir, `VRCX_Version.tar.xz`);

const newAppImage = path.join(buildDir, `VRCX_${formattedVersion}.AppImage`);
const newTarXz = path.join(buildDir, `VRCX_${formattedVersion}.tar.xz`);

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