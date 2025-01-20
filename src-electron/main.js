require('hazardous');
const path = require('path');
const {
    BrowserWindow,
    ipcMain,
    app,
    Tray,
    Menu,
    dialog,
    Notification
} = require('electron');
const fs = require('fs');
const https = require('https');

if (!isDotNetInstalled()) {
    dialog.showErrorBox('VRCX', 'Please install .NET 8.0 Runtime to run VRCX.');
    app.quit();
    return;
}
console.log('DOTNET_ROOT:', process.env.DOTNET_ROOT);

// get launch arguments
const args = process.argv.slice(1);
const noInstall = args.some((val) => val === '--no-install');
const homePath = getHomePath();
tryCopyFromWinePrefix();

const rootDir = app.getAppPath();
require(path.join(rootDir, 'build/Electron/VRCX-Electron.cjs'));

const InteropApi = require('./InteropApi');
const interopApi = new InteropApi();

const version = getVersion();
interopApi.getDotNetObject('ProgramElectron').PreInit(version);
interopApi.getDotNetObject('VRCXStorage').Load();
interopApi.getDotNetObject('ProgramElectron').Init();
interopApi.getDotNetObject('SQLiteLegacy').Init();
interopApi.getDotNetObject('AppApiElectron').Init();
interopApi.getDotNetObject('Discord').Init();
interopApi.getDotNetObject('WebApi').Init();
interopApi.getDotNetObject('LogWatcher').Init();

ipcMain.handle('callDotNetMethod', (event, className, methodName, args) => {
    return interopApi.callMethod(className, methodName, args);
});

let mainWindow = undefined;

const VRCXStorage = interopApi.getDotNetObject('VRCXStorage');
let isCloseToTray = VRCXStorage.Get('VRCX_CloseToTray') === 'true';
let appImagePath = process.env.APPIMAGE;

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
        const options = { args: process.argv.slice(1) };
        if (appImagePath) {
            options.execPath = appImagePath;
            options.args.unshift('--appimage-extract-and-run');
        }
        app.relaunch(options);
        app.exit(0);
    } else {
        app.relaunch();
        app.quit();
    }
});

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
        },
        webContents: {
            userAgent: version
        }
    });
    applyWindowState();
    const indexPath = path.join(rootDir, 'build/html/index.html');
    mainWindow.loadFile(indexPath, { userAgent: version });

    // add proxy config
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
        if (isCloseToTray && !app.isQuitting) {
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

function createTray() {
    const tray = new Tray(path.join(rootDir, 'images/tray.png'));
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
                app.isQuitting = true;
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

/*
async function installVRCXappImageLauncher() {
    const iconUrl =
    'https://raw.githubusercontent.com/vrcx-team/VRCX/master/VRCX.png';

    let targetIconName;
    const desktopFiles = fs.readdirSync(
        path.join(homePath, '.local/share/applications')
    );
    for (const file of desktopFiles) {
        if (file.includes('appimagekit_') && file.includes('VRCX')) {
            console.log('AppImageLauncher shortcut found:', file);
            targetIconName = file.replace('.desktop', '.png');
            targetIconName = targetIconName.replace('-', '_');
            try {
            } catch (err) {
                console.error('Error deleting shortcut:', err);
                return;
            }
        }
    }

    const iconPath = '~/.local/share/icons/' + targetIconName;
    const expandedPath = iconPath.replace('~', process.env.HOME);
    const targetIconPath = path.join(expandedPath);    
    await downloadIcon(iconUrl, targetIconPath);
}
*/

async function installVRCX() {
    console.log('Home path:', homePath);
    console.log('AppImage path:', appImagePath);
    if (!appImagePath) {
        console.error('AppImage path is not available!');
        return;
    }
    if (noInstall) {
        console.log('Skipping installation.');
        return;
    }

    /*
    let appImageLauncherInstalled = false;
    if (fs.existsSync('/usr/bin/AppImageLauncher')) {
        appImageLauncherInstalled = true;
    }
    */

    if (appImagePath.startsWith(path.join(homePath, 'Applications'))) {
        /*
        if (appImageLauncherInstalled) {
            installVRCXappImageLauncher();
        }
        */
        interopApi.getDotNetObject('Update').Init(appImagePath);
        console.log('VRCX is already installed.');
        return;
    }

    let currentName = path.basename(appImagePath);
    let newName = 'VRCX.AppImage';
    if (currentName !== newName) {
        const newPath = path.join(path.dirname(appImagePath), newName);
        try {
            fs.renameSync(appImagePath, newPath);
            console.log('AppImage renamed to:', newPath);
            appImagePath = newPath;
        } catch (err) {
            console.error('Error renaming AppImage:', err);
            dialog.showErrorBox('VRCX', 'Failed to rename AppImage.');
            return;
        }
    }

    if (
        process.env.APPIMAGE.startsWith(path.join(homePath, 'Applications')) &&
        path.basename(process.env.APPIMAGE) === 'VRCX.AppImage'
    ) {
        interopApi.getDotNetObject('Update').Init(appImagePath);
        console.log('VRCX is already installed.');
        return;
    }

    const targetPath = path.join(homePath, 'Applications');
    console.log('Target Path:', targetPath);

    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
    }

    const targetAppImagePath = path.join(targetPath, 'VRCX.AppImage');

    // Move the AppImage to the target directory
    try {
        if (fs.existsSync(targetAppImagePath)) {
            fs.unlinkSync(targetAppImagePath);
        }
        fs.renameSync(appImagePath, targetAppImagePath);
        appImagePath = targetAppImagePath;
        console.log('AppImage moved to:', targetAppImagePath);
    } catch (err) {
        console.error('Error moving AppImage:', err);
        dialog.showErrorBox('VRCX', 'Failed to move AppImage.');
        return;
    }

    // Download the icon and save it to the target directory
    const iconUrl =
        'https://raw.githubusercontent.com/vrcx-team/VRCX/master/VRCX.png';
    const iconPath = path.join(homePath, '.local/share/icons/VRCX.png');
    await downloadIcon(iconUrl, iconPath)
        .then(() => {
            console.log('Icon downloaded and saved to:', iconPath);
            const desktopFile = `[Desktop Entry]
Name=VRCX
Comment=Friendship management tool for VRChat
Exec=${appImagePath}
Icon=VRCX
Type=Application
Categories=Network;InstantMessaging;Game;
Terminal=false
StartupWMClass=VRCX
`;

            const desktopFilePath = path.join(
                homePath,
                '.local/share/applications/VRCX.desktop'
            );
            try {
                fs.writeFileSync(desktopFilePath, desktopFile);
                console.log('Desktop file created at:', desktopFilePath);
            } catch (err) {
                console.error('Error creating desktop file:', err);
                dialog.showErrorBox('VRCX', 'Failed to create desktop entry.');
                return;
            }
        })
        .catch((err) => {
            console.error('Error downloading icon:', err);
            dialog.showErrorBox('VRCX', 'Failed to download the icon.');
        });
    dialog.showMessageBox({
        type: 'info',
        title: 'VRCX',
        message: 'VRCX has been installed successfully.',
        detail: 'You can now find VRCX in your ~/Applications folder.'
    });
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
        return relativeHomePath;
    }
}

function getVersion() {
    let version = 'VRCX (Linux) Build';
    try {
        version = `VRCX (Linux) ${fs.readFileSync(path.join(rootDir, 'Version'), 'utf8').trim()}`;
    } catch (err) {
        console.error('Error reading Version:', err);
    }
    return version;
}

function isDotNetInstalled() {
    const result = require('child_process').spawnSync(
        'dotnet',
        ['--list-runtimes'],
        {
            encoding: 'utf-8'
        }
    );
    return result.stdout?.includes('.NETCore.App 8.0');
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
    if (VRCXStorage.Get('VRCX_StartAsMinimizedState') === 'true') {
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

    installVRCX();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// app.on('before-quit', function () {
//    mainWindow.webContents.send('windowClosed');
// });

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
