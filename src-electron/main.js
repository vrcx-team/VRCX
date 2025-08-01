require('hazardous');
const path = require('path');
const {
    BrowserWindow,
    ipcMain,
    app,
    Tray,
    Menu,
    dialog,
    Notification,
    nativeImage
} = require('electron');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const https = require('https');

//app.disableHardwareAcceleration();

if (process.platform === 'linux') {
    // Include bundled .NET runtime
    const bundledDotNetPath = path.join(
        process.resourcesPath,
        'dotnet-runtime'
    );
    if (fs.existsSync(bundledDotNetPath)) {
        process.env.DOTNET_ROOT = bundledDotNetPath;
        process.env.PATH = `${bundledDotNetPath}:${process.env.PATH}`;
    }
} else if (process.platform === 'darwin') {
    const dotnetPath = path.join('/usr/local/share/dotnet');
    const dotnetPathArm = path.join('/usr/local/share/dotnet/x64');
    if (fs.existsSync(dotnetPathArm)) {
        process.env.DOTNET_ROOT = dotnetPathArm;
        process.env.PATH = `${dotnetPathArm}:${process.env.PATH}`;
    } else if (fs.existsSync(dotnetPath)) {
        process.env.DOTNET_ROOT = dotnetPath;
        process.env.PATH = `${dotnetPath}:${process.env.PATH}`;
    }
}

if (!isDotNetInstalled()) {
    app.whenReady().then(() => {
        dialog.showErrorBox(
            'VRCX',
            'Please install .NET 9.0 Runtime "dotnet-runtime-9.0" to run VRCX.'
        );
        app.quit();
    });
}

let isOverlayActive = false;
let appIsQuitting = false;

// Get launch arguments
let appImagePath = process.env.APPIMAGE;
const args = process.argv.slice(1);
const noInstall = args.includes('--no-install');
const x11 = args.includes('--x11');
const noDesktop = args.includes('--no-desktop');
const startup = args.includes('--startup');

const homePath = getHomePath();
tryRelaunchWithArgs(args);
tryCopyFromWinePrefix();

const rootDir = app.getAppPath();
require(path.join(rootDir, 'build/Electron/VRCX-Electron.cjs'));

const InteropApi = require('./InteropApi');
const interopApi = new InteropApi();

const WRIST_FRAME_WIDTH = 512;
const WRIST_FRAME_HEIGHT = 512;
const WRIST_FRAME_SIZE = WRIST_FRAME_WIDTH * WRIST_FRAME_HEIGHT * 4;
const WRIST_SHM_PATH = '/dev/shm/vrcx_wrist_overlay';

function createWristOverlayWindowShm() {
    fs.writeFileSync(WRIST_SHM_PATH, Buffer.alloc(WRIST_FRAME_SIZE + 1));
}

const HMD_FRAME_WIDTH = 1024;
const HMD_FRAME_HEIGHT = 1024;
const HMD_FRAME_SIZE = HMD_FRAME_WIDTH * HMD_FRAME_HEIGHT * 4;
const HMD_SHM_PATH = '/dev/shm/vrcx_hmd_overlay';

function createHmdOverlayWindowShm() {
    fs.writeFileSync(HMD_SHM_PATH, Buffer.alloc(HMD_FRAME_SIZE + 1));
}

const version = getVersion();
interopApi.getDotNetObject('ProgramElectron').PreInit(version, args);
interopApi.getDotNetObject('VRCXStorage').Load();
interopApi.getDotNetObject('ProgramElectron').Init();
interopApi.getDotNetObject('SQLiteLegacy').Init();
interopApi.getDotNetObject('AppApiElectron').Init();
interopApi.getDotNetObject('Discord').Init();
interopApi.getDotNetObject('WebApi').Init();
interopApi.getDotNetObject('LogWatcher').Init();

interopApi.getDotNetObject('IPCServer').Init();
interopApi.getDotNetObject('SystemMonitorElectron').Init();
interopApi.getDotNetObject('AppApiVrElectron').Init();

ipcMain.handle('callDotNetMethod', (event, className, methodName, args) => {
    return interopApi.callMethod(className, methodName, args);
});

let mainWindow = undefined;

const VRCXStorage = interopApi.getDotNetObject('VRCXStorage');
const hasAskedToMoveAppImage =
    VRCXStorage.Get('VRCX_HasAskedToMoveAppImage') === 'true';
let isCloseToTray = VRCXStorage.Get('VRCX_CloseToTray') === 'true';

ipcMain.handle('applyWindowSettings', (event, position, size, state) => {
    if (position) {
        mainWindow.setPosition(parseInt(position.x), parseInt(position.y));
    }
    if (size) {
        mainWindow.setSize(parseInt(size.width), parseInt(size.height));
    }
    if (state) {
        if (state === '0') {
            mainWindow.restore();
        } else if (state === '1') {
            mainWindow.restore();
        } else if (state === '2') {
            mainWindow.maximize();
        }
    }
});

ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['png'] }]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('notification:showNotification', (event, title, body, icon) => {
    const notification = {
        title,
        body,
        icon
    };
    new Notification(notification).show();
});

ipcMain.handle('app:restart', () => {
    if (process.platform === 'linux') {
        const options = {
            execPath: process.execPath,
            args: process.argv.slice(1)
        };
        if (appImagePath) {
            options.execPath = appImagePath;
            if (!x11 && !options.args.includes('--appimage-extract-and-run')) {
                options.args.unshift('--appimage-extract-and-run');
            }
        }
        app.relaunch(options);
        app.exit(0);
    } else {
        app.relaunch();
        app.quit();
    }
});

ipcMain.handle('app:getWristOverlayWindow', () => {
    if (wristOverlayWindow && wristOverlayWindow.webContents) {
        return (
            !wristOverlayWindow.webContents.isLoading() &&
            wristOverlayWindow.webContents.isPainting()
        );
    }
    return false;
});

ipcMain.handle('app:getHmdOverlayWindow', () => {
    if (hmdOverlayWindow && hmdOverlayWindow.webContents) {
        return (
            !hmdOverlayWindow.webContents.isLoading() &&
            hmdOverlayWindow.webContents.isPainting()
        );
    }
    return false;
});

ipcMain.handle(
    'app:updateVr',
    (event, active, hmdOverlay, wristOverlay, menuButton, overlayHand) => {
        if (!active) {
            disposeOverlay();
            return;
        }
        isOverlayActive = true;

        if (!hmdOverlay) {
            destroyHmdOverlayWindow();
        } else if (active && !hmdOverlayWindow) {
            createHmdOverlayWindowOffscreen();
        }

        if (!wristOverlay) {
            destroyWristOverlayWindow();
        } else if (active && !wristOverlayWindow) {
            createWristOverlayWindowOffscreen();
        }
    }
);

function tryRelaunchWithArgs(args) {
    if (
        process.platform !== 'linux' ||
        x11 ||
        args.includes('--ozone-platform-hint=auto')
    ) {
        return;
    }

    const fullArgs = ['--ozone-platform-hint=auto', ...args];

    let execPath = process.execPath;

    if (appImagePath) {
        execPath = appImagePath;
        fullArgs.unshift('--appimage-extract-and-run');
    }

    console.log('Relaunching with args:', fullArgs);

    const child = spawn(execPath, fullArgs, {
        detached: true,
        stdio: 'inherit'
    });

    child.unref();

    app.exit(0);
}

function createWindow() {
    app.commandLine.appendSwitch('enable-speech-dispatcher');

    const x = parseInt(VRCXStorage.Get('VRCX_LocationX')) || 0;
    const y = parseInt(VRCXStorage.Get('VRCX_LocationY')) || 0;
    const width = parseInt(VRCXStorage.Get('VRCX_SizeWidth')) || 1920;
    const height = parseInt(VRCXStorage.Get('VRCX_SizeHeight')) || 1080;
    mainWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        icon: path.join(rootDir, 'VRCX.png'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    applyWindowState();
    const indexPath = path.join(rootDir, 'build/html/index.html');
    mainWindow.loadFile(indexPath);

    // add proxy config, doesn't work, thanks electron
    // const proxy = VRCXStorage.Get('VRCX_Proxy');
    // if (proxy) {
    //     session.setProxy(
    //         { proxyRules: proxy.replaceAll('://', '=') },
    //         function () {
    //             mainWindow.loadFile(indexPath);
    //         }
    //     );
    //     session.setProxy({
    //         proxyRules: proxy.replaceAll('://', '=')
    //     });
    // }

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    mainWindow.webContents.on('before-input-event', (event, input) => {
        if (input.control && input.key === '=') {
            mainWindow.webContents.setZoomLevel(
                mainWindow.webContents.getZoomLevel() + 1
            );
        }
    });

    mainWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
        const currentZoom = mainWindow.webContents.getZoomLevel();
        if (zoomDirection === 'in') {
            mainWindow.webContents.setZoomLevel(currentZoom + 1);
        } else {
            mainWindow.webContents.setZoomLevel(currentZoom - 1);
        }
    });
    mainWindow.webContents.setVisualZoomLevelLimits(1, 5);

    mainWindow.on('close', (event) => {
        isCloseToTray = VRCXStorage.Get('VRCX_CloseToTray') === 'true';
        if (isCloseToTray && !appIsQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    mainWindow.on('resize', () => {
        const [width, height] = mainWindow
            .getSize()
            .map((size) => size.toString());
        mainWindow.webContents.send('setWindowSize', { width, height });
    });

    mainWindow.on('move', () => {
        const [x, y] = mainWindow
            .getPosition()
            .map((coord) => coord.toString());
        mainWindow.webContents.send('setWindowPosition', { x, y });
    });

    mainWindow.on('maximize', () => {
        mainWindow.webContents.send('setWindowState', '2');
    });

    mainWindow.on('minimize', () => {
        mainWindow.webContents.send('setWindowState', '1');
    });

    mainWindow.on('unmaximize', () => {
        mainWindow.webContents.send('setWindowState', '0');
    });

    mainWindow.on('restore', () => {
        mainWindow.webContents.send('setWindowState', '0');
    });
}

let wristOverlayWindow = undefined;

function createWristOverlayWindowOffscreen() {
    if (!fs.existsSync(WRIST_SHM_PATH)) {
        createWristOverlayWindowShm();
    }

    const x = parseInt(VRCXStorage.Get('VRCX_LocationX')) || 0;
    const y = parseInt(VRCXStorage.Get('VRCX_LocationY')) || 0;
    const width = WRIST_FRAME_WIDTH;
    const height = WRIST_FRAME_HEIGHT;

    wristOverlayWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        icon: path.join(rootDir, 'VRCX.png'),
        autoHideMenuBar: true,
        transparent: true,
        frame: false,
        show: false,
        webPreferences: {
            offscreen: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    wristOverlayWindow.webContents.setFrameRate(2);

    const indexPath = path.join(rootDir, 'build/html/vr.html');
    const fileUrl = `file://${indexPath}?1`;
    wristOverlayWindow.loadURL(fileUrl, { userAgent: version });

    // Use paint event for offscreen rendering
    wristOverlayWindow.webContents.on('paint', (event, dirty, image) => {
        const buffer = image.toBitmap();
        //console.log('Captured wrist frame via paint event, size:', buffer.length);
        writeWristFrame(buffer);
    });
}

function writeWristFrame(imageBuffer) {
    try {
        const fd = fs.openSync(WRIST_SHM_PATH, 'r+');
        const buffer = Buffer.alloc(WRIST_FRAME_SIZE + 1);
        buffer[0] = 0; // not ready
        imageBuffer.copy(buffer, 1, 0, WRIST_FRAME_SIZE);
        buffer[0] = 1; // ready
        fs.writeSync(fd, buffer);
        fs.closeSync(fd);
        //console.log('Wrote wrist frame to shared memory');
    } catch (err) {
        console.error('Error writing wrist frame to shared memory:', err);
    }
}

function destroyWristOverlayWindow() {
    if (wristOverlayWindow && !wristOverlayWindow.isDestroyed()) {
        wristOverlayWindow.close();
    }
    wristOverlayWindow = undefined;
}

let hmdOverlayWindow = undefined;

function createHmdOverlayWindowOffscreen() {
    if (!fs.existsSync(HMD_SHM_PATH)) {
        createHmdOverlayWindowShm();
    }

    const x = parseInt(VRCXStorage.Get('VRCX_LocationX')) || 0;
    const y = parseInt(VRCXStorage.Get('VRCX_LocationY')) || 0;
    const width = HMD_FRAME_WIDTH;
    const height = HMD_FRAME_HEIGHT;

    hmdOverlayWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        icon: path.join(rootDir, 'VRCX.png'),
        autoHideMenuBar: true,
        transparent: true,
        frame: false,
        show: false,
        webPreferences: {
            offscreen: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });
    hmdOverlayWindow.webContents.setFrameRate(48);

    const indexPath = path.join(rootDir, 'build/html/vr.html');
    const fileUrl = `file://${indexPath}?2`;
    hmdOverlayWindow.loadURL(fileUrl, { userAgent: version });

    // Use paint event for offscreen rendering
    hmdOverlayWindow.webContents.on('paint', (event, dirty, image) => {
        const buffer = image.toBitmap();
        //console.log('Captured HMD frame via paint event, size:', buffer.length);
        writeHmdFrame(buffer);
    });
}

function writeHmdFrame(imageBuffer) {
    try {
        const fd = fs.openSync(HMD_SHM_PATH, 'r+');
        const buffer = Buffer.alloc(HMD_FRAME_SIZE + 1);
        buffer[0] = 0; // not ready
        imageBuffer.copy(buffer, 1, 0, HMD_FRAME_SIZE);
        buffer[0] = 1; // ready
        fs.writeSync(fd, buffer);
        fs.closeSync(fd);
        //console.log('Wrote HMD frame to shared memory');
    } catch (err) {
        console.error('Error writing HMD frame to shared memory:', err);
    }
}

function destroyHmdOverlayWindow() {
    if (hmdOverlayWindow && !hmdOverlayWindow.isDestroyed()) {
        hmdOverlayWindow.close();
    }
    hmdOverlayWindow = undefined;
}

function createTray() {
    let tray = null;
    if (process.platform === 'darwin') {
        const image = nativeImage.createFromPath(
            path.join(rootDir, 'images/tray.png')
        );
        tray = new Tray(image.resize({ width: 16, height: 16 }));
    } else {
        tray = new Tray(path.join(rootDir, 'images/tray.png'));
    }
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open',
            type: 'normal',
            click: function () {
                BrowserWindow.getAllWindows().forEach(function (win) {
                    win.show();
                });
            }
        },
        {
            label: 'DevTools',
            type: 'normal',
            click: function () {
                BrowserWindow.getAllWindows().forEach(function (win) {
                    win.webContents.openDevTools();
                });
            }
        },
        {
            label: 'Quit VRCX',
            type: 'normal',
            click: function () {
                appIsQuitting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('VRCX');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        BrowserWindow.getAllWindows().forEach(function (win) {
            win.show();
        });
    });
}

async function installVRCX() {
    console.log('Home path:', homePath);
    console.log('AppImage path:', appImagePath);
    if (!appImagePath) {
        console.error('AppImage path is not available!');
        return;
    }
    if (noInstall) {
        interopApi.getDotNetObject('Update').Init(appImagePath);
        console.log('Skipping installation.');
        return;
    }

    // rename AppImage to VRCX.AppImage
    const currentName = path.basename(appImagePath);
    const expectedName = 'VRCX.AppImage';
    if (currentName !== expectedName) {
        const newPath = path.join(path.dirname(appImagePath), expectedName);
        try {
            // remove existing VRCX.AppImage
            if (fs.existsSync(newPath)) {
                fs.unlinkSync(newPath);
            }
            fs.renameSync(appImagePath, newPath);
            console.log('AppImage renamed to:', newPath);
            appImagePath = newPath;
        } catch (err) {
            console.error(`Error renaming AppImage ${newPath}`, err);
            dialog.showErrorBox('VRCX', `Failed to rename AppImage ${newPath}`);
            return;
        }
    }

    // ask to move AppImage to ~/Applications
    const appImageHomePath = `${homePath}/Applications/VRCX.AppImage`;
    if (!hasAskedToMoveAppImage && appImagePath !== appImageHomePath) {
        const result = dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            title: 'VRCX',
            message: 'Do you want to install VRCX?',
            detail: 'VRCX will be moved to your ~/Applications folder.',
            buttons: ['No', 'Yes']
        });
        if (result === 0) {
            console.log('Cancel AppImage move to ~/Applications');
            // don't ask again
            VRCXStorage.Set('VRCX_HasAskedToMoveAppImage', 'true');
            VRCXStorage.Save();
        }
        if (result === 1) {
            console.log('Moving AppImage to ~/Applications');
            try {
                const applicationsPath = path.join(homePath, 'Applications');
                // create ~/Applications if it doesn't exist
                if (!fs.existsSync(applicationsPath)) {
                    fs.mkdirSync(applicationsPath);
                }
                // remove existing VRCX.AppImage
                if (fs.existsSync(appImageHomePath)) {
                    fs.unlinkSync(appImageHomePath);
                }
                fs.renameSync(appImagePath, appImageHomePath);
                appImagePath = appImageHomePath;
                console.log('AppImage moved to:', appImageHomePath);
            } catch (err) {
                console.error(`Error moving AppImage ${appImageHomePath}`, err);
                dialog.showErrorBox(
                    'VRCX',
                    `Failed to move AppImage ${appImageHomePath}`
                );
                return;
            }
        }
    }

    // inform .NET side about AppImage path
    interopApi.getDotNetObject('Update').Init(appImagePath);

    await createDesktopFile();
}

async function createDesktopFile() {
    if (noDesktop) {
        console.log('Skipping desktop file creation.');
        return;
    }

    // Download the icon and save it to the target directory
    const iconPath = path.join(homePath, '.local/share/icons/VRCX.png');
    if (!fs.existsSync(iconPath)) {
        const iconDir = path.dirname(iconPath);
        if (!fs.existsSync(iconDir)) {
            fs.mkdirSync(iconDir, { recursive: true });
        }
        const iconUrl =
            'https://raw.githubusercontent.com/vrcx-team/VRCX/master/VRCX.png';
        await downloadIcon(iconUrl, iconPath)
            .then(() => {
                console.log('Icon downloaded and saved to:', iconPath);
            })
            .catch((err) => {
                console.error('Error downloading icon:', err);
                dialog.showErrorBox('VRCX', 'Failed to download the icon.');
            });
    }

    // Create the desktop file
    const desktopFilePath = path.join(
        homePath,
        '.local/share/applications/VRCX.desktop'
    );

    const dotDesktop = {
        Name: 'VRCX',
        Version: version,
        Comment: 'Friendship management tool for VRChat',
        Exec: `${appImagePath} --ozone-platform-hint=auto %U`,
        Icon: 'VRCX',
        Type: 'Application',
        Categories: 'Network;InstantMessaging;Game;',
        Terminal: 'false',
        StartupWMClass: 'VRCX',
        MimeType: 'x-scheme-handler/vrcx;'
    };
    const desktopFile =
        '[Desktop Entry]\n' +
        Object.entries(dotDesktop)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
    try {
        // create/update the desktop file when needed
        let existingDesktopFile = '';
        if (fs.existsSync(desktopFilePath)) {
            existingDesktopFile = fs.readFileSync(desktopFilePath, 'utf8');
        }
        if (existingDesktopFile !== desktopFile) {
            fs.writeFileSync(desktopFilePath, desktopFile);
            console.log('Desktop file created at:', desktopFilePath);

            const result = spawnSync(
                'xdg-mime',
                ['default', 'VRCX.desktop', 'x-scheme-handler/vrcx'],
                {
                    encoding: 'utf-8'
                }
            );
            if (result.error) {
                console.error('Error setting MIME type:', result.error);
            } else {
                console.log('MIME type set x-scheme-handler/vrcx');
            }
        }
    } catch (err) {
        console.error('Error creating desktop file:', err);
        dialog.showErrorBox('VRCX', 'Failed to create desktop entry.');
        return;
    }
}

function downloadIcon(url, targetPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(targetPath);
        https
            .get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(
                        new Error(
                            `Failed to download icon, status code: ${response.statusCode}`
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
                fs.unlink(targetPath, () => reject(err)); // Delete the file if error occurs
            });
    });
}

function getVRCXPath() {
    if (process.platform === 'win32') {
        return path.join(process.env.APPDATA, 'VRCX');
    } else if (process.platform === 'linux') {
        return path.join(process.env.HOME, '.config/VRCX');
    } else if (process.platform === 'darwin') {
        return path.join(process.env.HOME, 'Library/Application Support/VRCX');
    }
    return '';
}

function getHomePath() {
    const relativeHomePath = path.join(app.getPath('home'));
    try {
        const absoluteHomePath = fs.realpathSync(relativeHomePath);
        return absoluteHomePath;
    } catch (err) {
        console.error('Error resolving absolute home path:', err);
        return relativeHomePath;
    }
}

function getVersion() {
    try {
        const versionFile = fs
            .readFileSync(path.join(rootDir, 'Version'), 'utf8')
            .trim();

        // look for trailing git hash "-22bcd96" to indicate nightly build
        const version = versionFile.split('-');
        console.log('Version:', versionFile);
        if (version.length > 0 && version[version.length - 1].length == 7) {
            return `VRCX (Linux) Nightly ${versionFile}`;
        } else {
            return `VRCX (Linux) ${versionFile}`;
        }
    } catch (err) {
        console.error('Error reading Version:', err);
        return 'VRCX (Linux) Nightly Build';
    }
}

function isDotNetInstalled() {
    let dotnetPath;

    if (process.env.DOTNET_ROOT) {
        dotnetPath = path.join(process.env.DOTNET_ROOT, 'dotnet');
        if (!fs.existsSync(dotnetPath)) {
            // fallback to command
            dotnetPath = 'dotnet';
        }
    } else {
        // fallback to command
        dotnetPath = 'dotnet';
    }

    console.log('Checking for .NET installation at:', dotnetPath);

    // Fallback to system .NET runtime
    const result = spawnSync(dotnetPath, ['--list-runtimes'], {
        encoding: 'utf-8'
    });
    return result.stdout?.includes('.NETCore.App 9.0');
}

function tryCopyFromWinePrefix() {
    try {
        if (!fs.existsSync(getVRCXPath())) {
            // try copy from old wine path
            const userName = process.env.USER || process.env.USERNAME;
            const oldPath = path.join(
                homePath,
                '.local/share/vrcx/drive_c/users',
                userName,
                'AppData/Roaming/VRCX'
            );
            const newPath = getVRCXPath();
            if (fs.existsSync(oldPath)) {
                fs.mkdirSync(newPath, { recursive: true });
                const files = fs.readdirSync(oldPath);
                for (const file of files) {
                    const oldFilePath = path.join(oldPath, file);
                    const newFilePath = path.join(newPath, file);
                    if (fs.lstatSync(oldFilePath).isDirectory()) {
                        continue;
                    }
                    fs.copyFileSync(oldFilePath, newFilePath);
                }
            }
        }
    } catch (err) {
        console.error('Error copying from wine prefix:', err);
        dialog.showErrorBox(
            'VRCX',
            'Failed to copy database from wine prefix.'
        );
    }
}

function applyWindowState() {
    if (VRCXStorage.Get('VRCX_StartAsMinimizedState') === 'true' && startup) {
        if (isCloseToTray) {
            mainWindow.hide();
            return;
        }
        mainWindow.minimize();
        return;
    }
    const windowState = parseInt(VRCXStorage.Get('VRCX_WindowState')) || -1;
    switch (windowState) {
        case -1:
            break;
        case 0:
            mainWindow.restore();
            break;
        case 1:
            mainWindow.minimize();
            break;
        case 2:
            mainWindow.maximize();
            break;
    }
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    if (process.platform === 'linux') {
        createWristOverlayWindowOffscreen();
        createHmdOverlayWindowOffscreen();
    }

    installVRCX();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

function disposeOverlay() {
    if (!isOverlayActive) {
        return;
    }
    isOverlayActive = false;
    if (wristOverlayWindow) {
        wristOverlayWindow.close();
        wristOverlayWindow = undefined;
    }
    if (hmdOverlayWindow) {
        hmdOverlayWindow.close();
        hmdOverlayWindow = undefined;
    }

    if (fs.existsSync(WRIST_SHM_PATH)) {
        fs.unlinkSync(WRIST_SHM_PATH);
    }
    if (fs.existsSync(HMD_SHM_PATH)) {
        fs.unlinkSync(HMD_SHM_PATH);
    }
}

app.on('before-quit', function () {
    disposeOverlay();

    mainWindow.webContents.send('windowClosed');
});

app.on('window-all-closed', function () {
    disposeOverlay();

    if (process.platform !== 'darwin') {
        app.quit();
    }
});
