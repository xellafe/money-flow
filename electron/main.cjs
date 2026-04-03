const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const googleDrive = require('./googleDrive.cjs');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Disabilita la GPU cache per evitare errori di permessi su Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

// Riferimento alla finestra principale
let mainWindow = null;
let isQuitting = false;

// Determina se siamo in development o production
const distPath = path.join(__dirname, '../dist/index.html');
const isDev = process.env.ELECTRON_DEV === 'true' || !fs.existsSync(distPath);

// Hot reload in development
if (isDev) {
  try {
    // Su Windows il binario è .cmd, su altri sistemi è senza estensione
    const electronBin = process.platform === 'win32' 
      ? path.join(__dirname, '../node_modules/electron/dist/electron.exe')
      : path.join(__dirname, '../node_modules/.bin/electron');
    
    require('electron-reload')(__dirname, {
      electron: electronBin,
      hardResetMethod: 'exit',
      forceHardReset: true,
    });
  } catch (e) {
    console.log('electron-reload not available:', e.message);
  }
}

// Auto-updater setup — called only in production
function setupAutoUpdater() {
  // Assign logger — writes to %APPDATA%\MoneyFlow\logs\main.log
  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = 'info';

  // Core config per CONTEXT.md decisions
  autoUpdater.autoDownload = false;     // D-07: renderer must call startDownload()
  autoUpdater.allowPrerelease = false;  // D-04: stable releases only

  // Push events → renderer (guarded against destroyed window)
  autoUpdater.on('update-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:update-not-available', info);
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:download-progress', progress);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:update-downloaded', info);
    }
  });

  // Error handler: single forwarding point for all updater errors (D-01)
  autoUpdater.on('error', (err) => {
    log.error('autoUpdater error:', err.message);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:error', err.message);
    }
  });

  // Startup check — 3s delay per D-06
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.error('Startup checkForUpdates failed:', err.message);
    });
  }, 3000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'MoneyFlow',
    icon: path.join(__dirname, '../public/logo.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: true,
    show: false,
  });

  // Intercetta la chiusura per fare backup automatico
  mainWindow.on('close', async (e) => {
    if (isQuitting) return; // Già in fase di chiusura
    
    // Verifica se l'utente è autenticato con Google Drive
    if (googleDrive.isAuthenticated()) {
      e.preventDefault(); // Blocca la chiusura temporaneamente
      isQuitting = true;
      
      // Chiedi al renderer di inviare i dati per il backup
      mainWindow.webContents.send('request-backup-data');
      
      // Timeout di sicurezza: se non riceviamo risposta in 10 secondi, chiudi comunque
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.destroy();
        }
      }, 10000);
    }
  });

  // Mostra la finestra quando è pronta (evita flash bianco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    // In development, carica dal server Vite
    mainWindow.loadURL('http://localhost:5173');
    // Apri DevTools in development
    // mainWindow.webContents.openDevTools();
  } else {
    // In production, carica i file buildati
    mainWindow.loadFile(distPath);
  }
}

// Quando Electron è pronto
app.whenReady().then(() => {
  // Imposta Content Security Policy
  // CSP: dev keeps 'unsafe-inline' for Tailwind v4 HMR; prod is strict
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const styleUnsafe = isDev ? " 'unsafe-inline'" : "";
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline'; " +
          `style-src 'self'${styleUnsafe}; ` +
          `style-src-elem 'self'${styleUnsafe}; ` +
          "font-src 'self' data:; " +
          "img-src 'self' data: https:; " +
          "connect-src 'self' http://localhost:* ws://localhost:* https://www.googleapis.com https://oauth2.googleapis.com"
        ]
      }
    });
  });

  createWindow();

  // Initialize auto-updater in production only (D-05)
  if (!isDev) {
    setupAutoUpdater();
  }

  app.on('activate', () => {
    // Su macOS, ricrea la finestra se l'icona nel dock viene cliccata
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Chiudi l'app quando tutte le finestre sono chiuse (eccetto su macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================
// IPC Handlers per Google Drive
// ============================================

// Handler per ricevere i dati di backup alla chiusura
ipcMain.on('backup-data-for-close', async (event, data) => {
  try {
    if (data && googleDrive.isAuthenticated()) {
      await googleDrive.uploadBackup(data);
    }
  } catch (error) {
    console.error('Errore durante il backup automatico:', error.message);
  } finally {
    // Chiudi la finestra dopo il backup (o in caso di errore)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy();
    }
  }
});
// ============================================

// Inizializza OAuth all'avvio
try {
  googleDrive.initializeOAuth();
} catch (error) {
  console.error('Errore inizializzazione Google OAuth:', error);
}

// Verifica autenticazione
ipcMain.handle('google-drive:is-authenticated', async () => {
  try {
    return googleDrive.isAuthenticated();
  } catch (error) {
    console.error('Errore verifica autenticazione:', error);
    return false;
  }
});

// Verifica permessi Drive
ipcMain.handle('google-drive:has-drive-permission', async () => {
  try {
    return googleDrive.hasDrivePermission();
  } catch (error) {
    console.error('Errore verifica permessi Drive:', error);
    return false;
  }
});

// Login
ipcMain.handle('google-drive:sign-in', async () => {
  try {
    const tokens = await googleDrive.signIn();
    return { success: true, tokens };
  } catch (error) {
    console.error('Errore login Google:', error);
    // Distingui tra annullamento e altri errori
    const isCancelled = error.code === 'AUTH_CANCELLED';
    return { success: false, error: error.message, cancelled: isCancelled };
  }
});

// Annulla login in corso
ipcMain.handle('google-drive:cancel-sign-in', async () => {
  try {
    googleDrive.cancelSignIn();
    return { success: true };
  } catch (error) {
    console.error('Errore annullamento login:', error);
    return { success: false, error: error.message };
  }
});

// Verifica se login in corso
ipcMain.handle('google-drive:is-signing-in', async () => {
  try {
    return googleDrive.isSigningIn();
  } catch (error) {
    return false;
  }
});

// Logout
ipcMain.handle('google-drive:sign-out', async () => {
  try {
    await googleDrive.signOut();
    return { success: true };
  } catch (error) {
    console.error('Errore logout Google:', error);
    return { success: false, error: error.message };
  }
});

// Upload backup
ipcMain.handle('google-drive:upload-backup', async (event, data) => {
  try {
    const result = await googleDrive.uploadBackup(data);
    return { success: true, ...result };
  } catch (error) {
    console.error('Errore upload backup:', error);
    return { success: false, error: error.message };
  }
});

// Download backup
ipcMain.handle('google-drive:download-backup', async () => {
  try {
    const result = await googleDrive.downloadBackup();
    if (!result) {
      return { success: true, data: null };
    }
    return { success: true, ...result };
  } catch (error) {
    console.error('Errore download backup:', error);
    return { success: false, error: error.message };
  }
});

// Info backup
ipcMain.handle('google-drive:get-backup-info', async () => {
  try {
    const info = await googleDrive.getBackupInfo();
    return { success: true, info };
  } catch (error) {
    console.error('Errore info backup:', error);
    return { success: false, error: error.message };
  }
});

// Elimina backup
ipcMain.handle('google-drive:delete-backup', async () => {
  try {
    const deleted = await googleDrive.deleteBackup();
    return { success: true, deleted };
  } catch (error) {
    console.error('Errore eliminazione backup:', error);
    return { success: false, error: error.message };
  }
});

// Info utente
ipcMain.handle('google-drive:get-user-info', async () => {
  try {
    const userInfo = await googleDrive.getUserInfo();
    return { success: true, userInfo };
  } catch (error) {
    console.error('Errore info utente:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// IPC Handlers per Auto-Updater
// ============================================

ipcMain.handle('updater:check-for-updates', async () => {
  try {
    await autoUpdater.checkForUpdates();
    return { success: true };
  } catch (err) {
    log.error('checkForUpdates error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('updater:start-download', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    log.error('downloadUpdate error:', err.message);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('updater:install-update', async () => {
  isQuitting = true;  // D-08: prevents backup flow in 'close' handler
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => app.getVersion());
