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

const rootDir = app.getAppPath();
require(path.join(rootDir, 'build/Electron/VRCX-Electron.cjs'));

const InteropApi = require('./InteropApi');
const interopApi = new InteropApi();

interopApi.getDotNetObject('ProgramElectron').PreInit();
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
const AppApiElectron = interopApi.getDotNetObject('AppApiElectron');
const version = AppApiElectron.GetVersion();
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
    //mainWindow.webContents.openDevTools()

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

async function installVRCX() {
    appImagePath = process.env.APPIMAGE;
    if (!appImagePath) {
        console.error('AppImage path is not available!');
        return;
    }

    let currentName = path.basename(appImagePath);
    let newName = currentName.replace(/VRCX_\d{8}/, 'VRCX');
    if (currentName !== newName) {
        const newPath = path.join(path.dirname(appImagePath), newName);
        try {
            fs.renameSync(appImagePath, newPath);
            console.log('AppImage renamed to:', newPath);
            appImagePath = newPath;
        } catch (err) {
            console.error('Error renaming AppImage:', err);
            dialog.showErrorBox('Error', 'Failed to rename AppImage.');
            return;
        }
    }

    if (
        appImagePath.startsWith(path.join(app.getPath('home'), 'Applications'))
    ) {
        console.log('VRCX is already installed.');
        return;
    }

    const targetPath = path.join(app.getPath('home'), 'Applications');
    console.log('AppImage Path:', appImagePath);
    console.log('Target Path:', targetPath);

    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath);
    }

    // Extract the filename from the AppImage path
    const appImageName = path.basename(appImagePath);
    const targetAppImagePath = path.join(targetPath, appImageName);

    // Move the AppImage to the target directory
    try {
        fs.renameSync(appImagePath, targetAppImagePath);
        appImagePath = targetAppImagePath;
        console.log('AppImage moved to:', targetAppImagePath);
    } catch (err) {
        console.error('Error moving AppImage:', err);
        dialog.showErrorBox('Error', 'Failed to move AppImage.');
        return;
    }

    // Download the icon and save it to the target directory
    const iconUrl =
        'https://raw.githubusercontent.com/vrcx-team/VRCX/master/VRCX.png';
    const targetIconPath = path.join(targetPath, 'VRCX.png');
    downloadIcon(iconUrl, targetIconPath)
        .then(() => {
            console.log('Icon downloaded and saved to:', targetIconPath);

            // Create a .desktop file in ~/.local/share/applications/
            const desktopFile = `[Desktop Entry]
Name=VRCX
Exec=${appImagePath}
Icon=${targetIconPath}
Type=Application
Categories=Network;InstantMessaging;Game;
Terminal=false
StartupWMClass=VRCX
`;

            const desktopFilePath = path.join(
                app.getPath('home'),
                '.local/share/applications/VRCX.desktop'
            );
            try {
                fs.writeFileSync(desktopFilePath, desktopFile);
                console.log('Desktop file created at:', desktopFilePath);
            } catch (err) {
                console.error('Error creating desktop file:', err);
                dialog.showErrorBox('Error', 'Failed to create desktop entry.');
                return;
            }
        })
        .catch((err) => {
            console.error('Error downloading icon:', err);
            dialog.showErrorBox('Error', 'Failed to download the icon.');
        });
}

// Function to download the icon and save it to a specific path
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

    interopApi.getDotNetObject('Update').Init(appImagePath);

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

//app.on('before-quit', function () {
//    mainWindow.webContents.send('windowClosed');
//});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
