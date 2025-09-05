function getArchAndPlatform() {
    // --arch= win32, darwin, linux
    // --platform= x64, arm64
    const args = process.argv.slice(2);
    let arch = process.arch.toString();
    let platform = process.platform.toString();
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--arch=')) {
            arch = args[i].split('=')[1];
        }
        if (args[i].startsWith('--platform=')) {
            platform = args[i].split('=')[1];
        }
    }
    console.log(`Using arch: ${arch}, platform: ${platform}`);
    return { arch, platform };
}

module.exports = { getArchAndPlatform };
