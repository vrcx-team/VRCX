const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, 'Version');
const packageJsonPath = path.join(__dirname, 'package.json');

let version = '';
try {
  version = fs.readFileSync(versionFilePath, 'utf8').trim();
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
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4), 'utf8');
  console.log(`Updated version in package.json to: ${version}`);
} catch (err) {
  console.error('Error writing to package.json:', err);
  process.exit(1);
}