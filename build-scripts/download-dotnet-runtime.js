const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { getArchAndPlatform } = require('./utils');
const { pipeline } = require('stream/promises');
const { unlink, copyFile, rename } = require('node:fs/promises');

const DOTNET_VERSION = '10.0.8';
const DOTNET_RUNTIME_DIR = path.join(
    __dirname,
    '..',
    'build',
    'Electron',
    'dotnet-runtime'
);

const DOTNET_CACHE_DIR = path.join(
    os.homedir(),
    '.cache',
    'vrcx-build',
    'dotnet-cache'
);

/**
 * Downloads a file from a URL and saves it to a target path
 * @param {string} url
 * @param {string} targetPath
 * @returns {Promise<void>} A promise that resolves when the file is downloaded and saved
 */
async function downloadFile(url, targetPath) {
    const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `Failed to download, url: ${url} status code: ${response.status}`
            );
        }

        const fileStream = fs.createWriteStream(tempPath);
        // @ts-ignore response.ok is true here, so response.body is not null
        await pipeline(response.body, fileStream);

        // Atomically publish the completed download.
        await rename(tempPath, targetPath);
    } catch (error) {
        const error2 = /** @type {Error} */ (error);
        console.error('Error downloading file:', error2.message);

        try {
            await unlink(tempPath);
        } catch (error) {
            const unlinkError = /** @type {NodeJS.ErrnoException} */ (error);
            if (unlinkError.code !== 'ENOENT') {
                console.error('Error cleaning up temporary file:', unlinkError);
            }
        }

        throw error;
    }
}

/**
 * Extracts a tar.gz file to a target directory
 * @param {string} tarGzPath
 * @param {string} extractDir
 * @returns {Promise<void>} A promise that resolves when the file is extracted
 */
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

/**
 * Downloads the .NET runtime for the specified architecture and platform
 * @param {string} arch
 * @param {string} platform
 * @returns {Promise<void>} A promise that resolves when the .NET runtime is downloaded and extracted
 */
async function downloadDotnetRuntime(arch, platform) {
    if (!arch || !platform) {
        throw new Error('Architecture and platform must be specified');
    }

    let dotnetPlatform = '';
    if (platform === 'linux') {
        dotnetPlatform = 'linux';
    } else if (platform === 'darwin') {
        dotnetPlatform = 'osx';
    } else if (platform === 'win32') {
        // Windows is a zip file instead of tar.gz, which we do not handle here, skip
        console.log('Skipping .NET runtime download on Windows');
        return;
        // dotnetPlatform = 'win';
    } else {
        throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!fs.existsSync(DOTNET_CACHE_DIR)) {
        fs.mkdirSync(DOTNET_CACHE_DIR, { recursive: true });
    }

    if (!fs.existsSync(DOTNET_RUNTIME_DIR)) {
        fs.mkdirSync(DOTNET_RUNTIME_DIR, { recursive: true });
    }

    const fileName = `dotnet-runtime-${DOTNET_VERSION}-${dotnetPlatform}-${arch}.tar.gz`;
    const tarGzPath = path.join(DOTNET_RUNTIME_DIR, fileName);
    const dotnetRuntimeUrl = `https://builds.dotnet.microsoft.com/dotnet/Runtime/${DOTNET_VERSION}/${fileName}`;
    const cacheFilePath = path.join(DOTNET_CACHE_DIR, fileName);

    // Download .NET runtime if it doesn't exist in the cache
    if (!fs.existsSync(cacheFilePath)) {
        console.log(
            `Downloading .NET ${DOTNET_VERSION}-${dotnetPlatform}-${arch} runtime...`
        );
        await downloadFile(dotnetRuntimeUrl, cacheFilePath);
        console.log(`Downloaded ${dotnetRuntimeUrl} to ${cacheFilePath}`);
    } else {
        console.log(`Using cached .NET runtime at ${cacheFilePath}`);
    }

    // copy the cached file to the target directory
    await copyFile(cacheFilePath, tarGzPath);
    console.log(`Copied ${cacheFilePath} to ${tarGzPath}`);

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
}

const { arch, platform } = getArchAndPlatform();
downloadDotnetRuntime(arch, platform);
