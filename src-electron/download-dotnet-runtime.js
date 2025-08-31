const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');

let runnerArch = process.arch.toString();
let runnerPlatform = process.platform.toString();
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--arch' && i + 1 < args.length) {
        runnerArch = args[i + 1];
    } else if (args[i] === '--platform' && i + 1 < args.length) {
        runnerPlatform = args[i + 1];
    }
}
let platform = '';
if (runnerPlatform === 'linux') {
    platform = 'linux';
} else if (runnerPlatform === 'darwin') {
    platform = 'osx';
} else if (runnerPlatform === 'win32') {
    platform = 'win';
} else {
    throw new Error(`Unsupported platform: ${runnerPlatform}`);
}

const DOTNET_VERSION = '9.0.8';
const DOTNET_RUNTIME_URL = `https://builds.dotnet.microsoft.com/dotnet/Runtime/${DOTNET_VERSION}/dotnet-runtime-${DOTNET_VERSION}-${platform}-${runnerArch}.tar.gz`;
const DOTNET_RUNTIME_DIR = path.join(
    __dirname,
    '..',
    'build',
    'Electron',
    'dotnet-runtime'
);

async function downloadFile(url, targetPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(targetPath);
        https
            .get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(
                        new Error(
                            `Failed to download, status code: ${response.statusCode}`
                        )
                    );
                    return;
                }
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            })
            .on('error', (err) => {
                fs.unlink(targetPath, () => reject(err));
            });
    });
}

async function extractTarGz(tarGzPath, extractDir) {
    return new Promise((resolve, reject) => {
        const tar = spawnSync(
            'tar',
            ['-xzf', tarGzPath, '-C', extractDir, '--strip-components=1'],
            {
                stdio: 'inherit'
            }
        );

        if (tar.status === 0) {
            resolve();
        } else {
            reject(
                new Error(`tar extraction failed with status ${tar.status}`)
            );
        }
    });
}

async function main() {
    if (platform !== 'linux' && platform !== 'darwin') {
        console.log('Skipping .NET runtime download on non supported platform');
        return;
    }

    console.log(
        `Downloading .NET ${DOTNET_VERSION}-${platform}-${runnerArch} runtime...`
    );

    if (!fs.existsSync(DOTNET_RUNTIME_DIR)) {
        fs.mkdirSync(DOTNET_RUNTIME_DIR, { recursive: true });
    }

    const tarGzPath = path.join(DOTNET_RUNTIME_DIR, 'dotnet-runtime.tar.gz');

    try {
        // Download .NET runtime
        await downloadFile(DOTNET_RUNTIME_URL, tarGzPath);
        console.log('Download completed');

        // Extract .NET runtime to a temporary directory first
        const tempExtractDir = path.join(DOTNET_RUNTIME_DIR, 'temp');
        if (!fs.existsSync(tempExtractDir)) {
            fs.mkdirSync(tempExtractDir, { recursive: true });
        }

        console.log('Extracting .NET runtime...');
        await extractTarGz(tarGzPath, tempExtractDir);
        console.log('Extraction completed');

        // Clean up tar.gz file
        fs.unlinkSync(tarGzPath);
        console.log('Cleanup completed');

        // Ensure the dotnet executable is executable
        const extractedDotnet = path.join(tempExtractDir, 'dotnet');
        fs.chmodSync(extractedDotnet, 0o755);

        // Move all other files to the root of dotnet-runtime
        const files = fs.readdirSync(tempExtractDir);
        for (const file of files) {
            const sourcePath = path.join(tempExtractDir, file);
            const targetPath = path.join(DOTNET_RUNTIME_DIR, file);

            if (fs.existsSync(targetPath)) {
                if (fs.lstatSync(sourcePath).isDirectory()) {
                    // Remove existing directory and move new one
                    fs.rmSync(targetPath, { recursive: true, force: true });
                } else {
                    // Remove existing file
                    fs.unlinkSync(targetPath);
                }
            }

            fs.renameSync(sourcePath, targetPath);
        }

        // Clean up temp directory
        fs.rmSync(tempExtractDir, { recursive: true, force: true });

        console.log(
            `.NET runtime downloaded and extracted to: ${DOTNET_RUNTIME_DIR}`
        );
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { downloadFile, extractTarGz };
